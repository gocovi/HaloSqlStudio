import type { ApiResponse } from "./types";
import * as authService from "@/services/auth/authService";

export interface ApiClientConfig {
    baseUrl: string;
    getAccessToken: () => Promise<string | null>;
    onTokenRefresh: () => Promise<boolean>;
    onAuthExpired: () => void;
}

export class ApiClient {
    private config: ApiClientConfig;

    constructor(config: ApiClientConfig) {
        this.config = config;
    }

    async makeRequest(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse> {
        try {
            const token = await this.config.getAccessToken();
            if (!token) {
                throw new Error("No access token available");
            }

            const url = `${this.config.baseUrl}/api${endpoint}`;

            const response = await fetch(url, {
                ...options,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    ...options.headers,
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Try to refresh the token
                    const refreshed = await this.config.onTokenRefresh();
                    if (refreshed) {
                        console.log(
                            "Token refresh successful, retrying request..."
                        );
                        // Retry the request with the new token
                        return this.makeRequest(endpoint, options);
                    } else {
                        console.error(
                            "Token refresh failed, clearing authentication and redirecting..."
                        );
                        // Token refresh failed - clear auth and redirect immediately
                        this.config.onAuthExpired();
                        // This will redirect to login, so we return a rejected promise
                        // that will never resolve
                        return new Promise((_, reject) => {
                            // This promise will never resolve because the page will redirect
                            reject(
                                new Error(
                                    "Authentication expired - redirecting to login"
                                )
                            );
                        });
                    }
                }

                // Handle other HTTP errors
                const errorText = await response.text();
                console.error(
                    `API request failed: ${response.status} ${response.statusText}`,
                    errorText
                );
                throw new Error(`API request failed: ${response.statusText}`);
            }

            return response.json();
        } catch (error) {
            console.error("API request error:", error);
            throw error;
        }
    }
}

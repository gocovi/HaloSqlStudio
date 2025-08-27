import { ApiClient } from "./client";
import * as queryApi from "./queries";
import type { QueryResult, TableInfo } from "./types";
import * as authService from "@/services/auth/authService";
import type { HaloConfig } from "@/hooks/useConfig";

// Simple API service - no React hooks, just a service instance
class ApiService {
    private apiClient: ApiClient | null = null;
    private config: HaloConfig | null = null;

    constructor() {
        // Initialize with default config
        this.initializeClient();
    }

    private initializeClient() {
        // Get config from localStorage directly to avoid hook dependencies
        try {
            const stored = localStorage.getItem("halo-config");
            if (stored) {
                this.config = JSON.parse(stored);
                this.createClient();
            }
        } catch (error) {
            console.warn("Failed to read config from localStorage:", error);
        }
    }

    private createClient() {
        if (!this.config?.resourceServer) return;

        this.apiClient = new ApiClient({
            baseUrl: this.config.resourceServer,
            getAccessToken: async () => {
                const tokens = authService.loadTokens();
                return tokens?.access_token || null;
            },
            onTokenRefresh: async () => {
                const success = await authService.refreshToken({
                    authServer: this.config.authServer,
                    clientId: this.config.clientId,
                    redirectUri: this.config.redirectUri,
                });

                if (!success) {
                    authService.logout();
                }

                return success;
            },
            onAuthExpired: () => {
                // Handled by authService.logout()
            },
        });
    }

    // Update config and recreate client
    updateConfig(newConfig: HaloConfig) {
        this.config = newConfig;
        this.createClient();
    }

    // Execute SQL query
    async executeQuery(sql: string): Promise<QueryResult> {
        if (!this.apiClient) {
            throw new Error("API not configured - check configuration");
        }

        return await queryApi.executeQuery(this.apiClient, sql);
    }

    // Get tables
    async getTables(): Promise<TableInfo[]> {
        if (!this.apiClient) {
            throw new Error("API not configured - check configuration");
        }

        return await queryApi.getTables(this.apiClient);
    }

    // Check if configured
    isConfigured(): boolean {
        return !!this.apiClient;
    }
}

// Export singleton instance
export const apiService = new ApiService();

// Hook to use the service (optional - for React components)
export function useApi() {
    return {
        executeQuery: apiService.executeQuery.bind(apiService),
        getTables: apiService.getTables.bind(apiService),
        isConfigured: apiService.isConfigured(),
        // Add loading state management if needed
        isLoading: false,
        error: null,
        clearError: () => {},
    };
}

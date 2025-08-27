import { useState, useCallback, useMemo } from "react";
import { useConfig } from "./useConfig";
import { ApiClient } from "@/services/api/client";
import * as queryApi from "@/services/api/queries";
import type { QueryResult, TableInfo } from "@/services/api/types";
import * as authService from "@/services/auth/authService";

export function useApi() {
    const { config } = useConfig();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Create API client instance - only recreate when config changes
    const apiClient = useMemo(() => {
        if (!config.resourceServer) return null;

        return new ApiClient({
            baseUrl: config.resourceServer,
            getAccessToken: async () => {
                // Simple token retrieval - no complex refresh logic here
                const tokens = authService.loadTokens();
                return tokens?.access_token || null;
            },
            onTokenRefresh: async () => {
                // Handle token refresh when API client gets 401
                const success = await authService.refreshToken({
                    authServer: config.authServer,
                    clientId: config.clientId,
                    redirectUri: config.redirectUri,
                });

                if (!success) {
                    // Refresh failed - clear auth and redirect to login
                    authService.logout();
                }

                return success;
            },
            onAuthExpired: () => {
                // This will be handled by the API client automatically
                // The auth service will redirect to login
            },
        });
    }, [
        config.resourceServer,
        config.authServer,
        config.clientId,
        config.redirectUri,
    ]);

    // Execute SQL query
    const executeQuery = useCallback(
        async (sql: string): Promise<QueryResult> => {
            if (!apiClient) {
                throw new Error("API not configured - check configuration");
            }

            setIsLoading(true);
            setError(null);

            try {
                const result = await queryApi.executeQuery(apiClient, sql);
                return result;
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : "An error occurred";
                setError(errorMessage);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [apiClient]
    );

    // Get tables
    const getTables = useCallback(async (): Promise<TableInfo[]> => {
        if (!apiClient) {
            throw new Error("API not configured - check configuration");
        }

        try {
            return await queryApi.getTables(apiClient);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Failed to fetch tables";
            setError(errorMessage);
            throw err;
        }
    }, [apiClient]);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        executeQuery,
        getTables,
        isLoading,
        error,
        clearError,
        isConfigured: !!apiClient,
    };
}

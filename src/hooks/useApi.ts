import { useState, useCallback, useMemo } from "react";
import { useConfig } from "./useConfig";
import { ApiClient } from "@/services/api/client";
import type { QueryResult, TableInfo, ReportInfo } from "@/services/api/types";
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
                const startTime = Date.now();

                const body = [
                    {
                        sql,
                        _testonly: true,
                        _loadreportonly: true,
                    },
                ];

                const response = await apiClient.makeRequest("/Report", {
                    method: "POST",
                    body: JSON.stringify(body),
                });

                const executionTime = Date.now() - startTime;

                // Check for SQL errors first
                if (response.report?.load_error) {
                    return {
                        columns: [],
                        rows: [],
                        executionTime,
                        error: response.report.load_error,
                        hasError: true,
                    };
                }

                if (
                    response.available_columns &&
                    response.report &&
                    response.report.rows
                ) {
                    return {
                        columns: response.available_columns,
                        rows: response.report.rows,
                        rowCount: response.report.rows.length,
                        executionTime,
                        hasError: false,
                    };
                }

                // Fallback for unexpected response format
                return {
                    columns: [],
                    rows: [],
                    executionTime,
                    error: "Unexpected response format",
                    hasError: true,
                };
            } catch (error) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "Failed to execute query";
                setError(errorMessage);
                throw error;
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
            const result = await executeQuery(
                "SELECT TABLE_NAME as name, COLUMN_NAME as column_name, DATA_TYPE as data_type FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'dbo'"
            );

            if (!result.rows || result.hasError) {
                throw new Error(result.error || "Failed to fetch tables");
            }

            // Group columns by table name
            const tableMap = new Map<
                string,
                { name: string; columns: { name: string; data_type: string }[] }
            >();
            result.rows.forEach(
                (row: Record<string, string>, index: number) => {
                    const tableName = row.name;
                    const column = {
                        name: row.column_name,
                        data_type: row.data_type,
                    };

                    if (!tableMap.has(tableName)) {
                        tableMap.set(tableName, {
                            name: tableName,
                            columns: [],
                        });
                    }
                    tableMap.get(tableName)!.columns.push(column);
                }
            );

            // Convert to array and sort, providing required ColumnInfo properties
            const tables: TableInfo[] = Array.from(tableMap.values())
                .map((table) => ({
                    name: table.name,
                    columns: table.columns
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((col, index) => ({
                            id: index,
                            name: col.name,
                            data_type: col.data_type,
                            data_type_group: "unknown", // Default value since we don't have this info
                        })),
                }))
                .sort((a, b) => a.name.localeCompare(b.name));

            return tables;
        } catch (error) {
            console.error("Error fetching tables:", error);
            throw error;
        }
    }, [apiClient, executeQuery]);

    // Get reports
    const getReports = useCallback(async (): Promise<ReportInfo[]> => {
        if (!apiClient) {
            throw new Error("API not configured - check configuration");
        }

        try {
            const result = await executeQuery(
                `SELECT APid [Id], fvalue [Group], APTitle [Name], APSQL [SQL] FROM AnalyzerProfile JOIN LOOKUP ON (APGroupID + 1) = fcode AND fid = 41`
            );

            if (!result.rows || result.hasError) {
                throw new Error(result.error || "Failed to fetch reports");
            }

            // Group reports by fvalue (Group)
            const groupMap = new Map<
                string,
                { id: string; name: string; sql: string }[]
            >();
            result.rows.forEach((row: Record<string, string>) => {
                const group = row.Group || "Uncategorized";
                const report = {
                    id: row.Id.toString(),
                    name: row.Name || "Unnamed Report",
                    sql: row.SQL || "",
                };

                if (!groupMap.has(group)) {
                    groupMap.set(group, []);
                }
                groupMap.get(group)!.push(report);
            });

            // Convert to array and sort
            const reports: ReportInfo[] = Array.from(groupMap.entries())
                .map(([groupName, groupReports]) => ({
                    name: groupName,
                    reports: groupReports.sort((a, b) =>
                        a.name.localeCompare(b.name)
                    ),
                }))
                .sort((a, b) => a.name.localeCompare(b.name));

            return reports;
        } catch (error) {
            console.error("Error fetching reports:", error);
            throw error;
        }
    }, [apiClient, executeQuery]);

    // Create or update report
    const createOrUpdateReport = useCallback(
        async (reportData: {
            sql: string;
            name: string;
            description?: string;
            id?: string;
        }): Promise<{ id: string }> => {
            if (!apiClient) {
                throw new Error("API not configured - check configuration");
            }

            // Clear any previous errors when attempting to save
            setError(null);

            try {
                const body: any = {
                    sql: reportData.sql,
                    name: reportData.name,
                    description: reportData.description || "",
                };

                // If we have an id, include it for updates
                if (reportData.id) {
                    body.id = parseInt(reportData.id, 10);
                }

                const result = await apiClient.makeRequest("/report", {
                    method: "POST",
                    body: JSON.stringify([body]),
                });

                // The API returns either an array with the created/updated report or a single object
                if (
                    Array.isArray(result) &&
                    result.length > 0 &&
                    result[0].id
                ) {
                    // Array format: [{ id: 123 }]
                    return { id: result[0].id.toString() };
                } else if (result && typeof result === "object" && result.id) {
                    // Single object format: { id: 123 }
                    return { id: result.id.toString() };
                } else {
                    throw new Error("Invalid response format from server");
                }
            } catch (error) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "Failed to save report";
                setError(errorMessage);
                throw error;
            }
        },
        [apiClient]
    );

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        executeQuery,
        getTables,
        getReports,
        createOrUpdateReport,
        isLoading,
        error,
        clearError,
    };
}

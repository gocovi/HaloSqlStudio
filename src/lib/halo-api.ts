import { haloAuthService } from "./halo-auth";
import { getHaloConfig } from "./halo-config";

export interface QueryResult {
    columns: ColumnInfo[];
    rows: Record<string, string>[];
    rowCount?: number;
    executionTime?: number;
    error?: string;
    hasError?: boolean;
}

export interface TableInfo {
    name: string;
    columns: ColumnInfo[];
}

export interface ColumnInfo {
    id: number;
    name: string;
    data_type: string;
    data_type_group: string;
}

class HaloApiService {
    private async makeRequest(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<{
        available_columns?: ColumnInfo[];
        report?: {
            rows: Record<string, string>[];
            load_error?: string;
            loaded?: boolean;
        };
    }> {
        try {
            const token = await haloAuthService.getAccessToken();
            if (!token) {
                throw new Error("No access token available");
            }

            const config = getHaloConfig();
            const url = `${config.resourceServer}/api${endpoint}`;

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
                    const refreshed = await haloAuthService.refreshToken();
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
                        haloAuthService.forceLogout();
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
            // For any error, just log and rethrow
            console.error("API request error:", error);
            throw error;
        }
    }

    // Execute SQL query
    async executeQuery(sql: string): Promise<QueryResult> {
        const startTime = Date.now();

        try {
            const body = [
                {
                    sql,
                    _testonly: true,
                    _loadreportonly: true,
                },
            ];

            const response = await this.makeRequest("/Report", {
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

            return {
                columns: [],
                rows: [],
                executionTime,
                hasError: false,
            };
        } catch (error) {
            console.error("Query execution error:", error);
            throw error;
        }
    }

    // Get list of tables
    async getTables(): Promise<TableInfo[]> {
        try {
            const sql = `
        SELECT 
          t.name AS table_name,
          c.name AS column_name,
          ty.name AS data_type,
          c.is_nullable,
          ep.value AS description
        FROM sys.tables t
        INNER JOIN sys.columns c ON t.object_id = c.object_id
        INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
        LEFT JOIN sys.extended_properties ep ON ep.major_id = t.object_id 
          AND ep.minor_id = c.column_id 
          AND ep.name = 'MS_Description'
        WHERE t.is_ms_shipped = 0
      `;

            const result = await this.executeQuery(sql);

            // Group columns by table
            const tableMap = new Map<string, ColumnInfo[]>();

            for (let i = 0; i < result.rows.length; i++) {
                const row = result.rows[i];
                const tableName = row.table_name as string;
                const columnName = row.column_name as string;
                const dataType = row.data_type as string;
                const isNullable = parseInt(row.is_nullable as string, 10);
                const description = (row.description as string) || "";

                if (!tableMap.has(tableName)) {
                    tableMap.set(tableName, []);
                }

                tableMap.get(tableName)!.push({
                    id: i,
                    name: columnName,
                    data_type: dataType,
                    data_type_group: isNullable === 1 ? "nullable" : "required",
                });
            }

            // Sort tables and columns alphabetically
            const sortedTables = Array.from(tableMap.entries())
                .map(([name, columns]) => ({
                    name,
                    columns: columns.sort((a, b) =>
                        a.name.localeCompare(b.name)
                    ),
                }))
                .sort((a, b) => a.name.localeCompare(b.name));

            return sortedTables;
        } catch (error) {
            console.error("Error fetching tables:", error);
            // Fallback to a simpler query if the system tables query fails
            return this.getTablesFallback();
        }
    }

    // Fallback method for getting tables
    private async getTablesFallback(): Promise<TableInfo[]> {
        try {
            // Try to get tables from common Halo tables
            const commonTables = [
                "faults",
                "users",
                "area",
                "requesttype",
                "tstatus",
            ];
            const tables: TableInfo[] = [];

            for (const tableName of commonTables) {
                try {
                    // Try to get a single row to check if table exists
                    const result = await this.executeQuery(
                        `SELECT TOP 1 * FROM ${tableName}`
                    );
                    if (result.rows.length > 0) {
                        // Get column info from the result
                        const columns: ColumnInfo[] = [];
                        for (let i = 0; i < result.columns.length; i++) {
                            const column = result.columns[i];
                            columns.push({
                                id: i,
                                name: column.name,
                                data_type: "unknown",
                                data_type_group: "unknown",
                            });
                        }
                        // Sort columns alphabetically
                        columns.sort((a, b) => a.name.localeCompare(b.name));
                        tables.push({ name: tableName, columns });
                    }
                } catch (e) {
                    // Table doesn't exist or no access, skip
                    continue;
                }
            }

            // Sort tables alphabetically
            return tables.sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
            console.error("Fallback table fetch failed:", error);
            return [];
        }
    }

    // Get table schema
    async getTableSchema(tableName: string): Promise<ColumnInfo[]> {
        try {
            const sql = `SELECT TOP 1 * FROM ${tableName}`;
            const result = await this.executeQuery(sql);

            return result.columns.map((column, index) => ({
                id: index,
                name: column.name,
                data_type: "unknown",
                data_type_group: "unknown",
            }));
        } catch (error) {
            console.error(
                `Error fetching schema for table ${tableName}:`,
                error
            );
            return [];
        }
    }

    // Search tables and columns
    async searchTablesAndColumns(
        searchTerm: string
    ): Promise<{ table: string; column: string; type: string }[]> {
        try {
            const tables = await this.getTables();
            const results: { table: string; column: string; type: string }[] =
                [];

            for (const table of tables) {
                if (
                    table.name.toLowerCase().includes(searchTerm.toLowerCase())
                ) {
                    results.push({
                        table: table.name,
                        column: "*",
                        type: "table",
                    });
                }

                for (const column of table.columns) {
                    if (
                        column.name
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())
                    ) {
                        results.push({
                            table: table.name,
                            column: column.name,
                            type: column.data_type,
                        });
                    }
                }
            }

            return results;
        } catch (error) {
            console.error("Search error:", error);
            return [];
        }
    }
}

export const haloApiService = new HaloApiService();

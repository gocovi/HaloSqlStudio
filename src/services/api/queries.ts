import type { QueryResult, TableInfo, ColumnInfo } from "./types";
import type { ApiClient } from "./client";

export async function executeQuery(
    apiClient: ApiClient,
    sql: string
): Promise<QueryResult> {
    const startTime = Date.now();

    try {
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

export async function getTables(apiClient: ApiClient): Promise<TableInfo[]> {
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

        const result = await executeQuery(apiClient, sql);

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
                columns: columns.sort((a, b) => a.name.localeCompare(b.name)),
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

        return sortedTables;
    } catch (error) {
        console.error("Error fetching tables:", error);
        // Fallback to a simpler query if the system tables query fails
        return getTablesFallback(apiClient);
    }
}

async function getTablesFallback(apiClient: ApiClient): Promise<TableInfo[]> {
    try {
        const sql = `
        SELECT 
          t.name AS table_name,
          c.name AS column_name,
          ty.name AS data_type
        FROM sys.tables t
        INNER JOIN sys.columns c ON t.object_id = c.object_id
        INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
        WHERE t.is_ms_shipped = 0
      `;

        const result = await executeQuery(apiClient, sql);

        // Group columns by table
        const tableMap = new Map<string, ColumnInfo[]>();

        for (let i = 0; i < result.rows.length; i++) {
            const row = result.rows[i];
            const tableName = row.table_name as string;
            const columnName = row.column_name as string;
            const dataType = row.data_type as string;

            if (!tableMap.has(tableName)) {
                tableMap.set(tableName, []);
            }

            tableMap.get(tableName)!.push({
                id: i,
                name: columnName,
                data_type: dataType,
                data_type_group: "unknown",
            });
        }

        // Sort tables and columns alphabetically
        const sortedTables = Array.from(tableMap.entries())
            .map(([name, columns]) => ({
                name,
                columns: columns.sort((a, b) => a.name.localeCompare(b.name)),
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

        return sortedTables;
    } catch (error) {
        console.error("Fallback table fetch also failed:", error);
        return [];
    }
}

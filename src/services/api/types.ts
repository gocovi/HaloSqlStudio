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

export interface ApiResponse {
    available_columns?: ColumnInfo[];
    report?: {
        rows: Record<string, string>[];
        load_error?: string;
        loaded?: boolean;
    };
}

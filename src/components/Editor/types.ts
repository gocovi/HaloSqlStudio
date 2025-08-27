export interface QueryResult {
    rows: any[];
    columns?: string[];
    rowCount?: number;
    executionTime?: number;
    hasError?: boolean;
    error?: string;
}

export interface Report {
    id: string;
    name: string;
    sql: string;
}

export interface CodeWarning {
    id: string;
    title: string;
    description: string;
    severity: "error" | "warning" | "info";
    category: "syntax" | "compatibility" | "performance" | "style";

    // Function to detect if this warning applies to the given SQL
    test: (sql: string) => boolean;

    // Function to provide a fix (optional)
    fix?: (sql: string) => string;

    // Line numbers where this warning occurs (for highlighting)
    lineNumbers?: number[];

    // Additional context data
    context?: Record<string, any>;
}

export interface WarningResult {
    warning: CodeWarning;
    lineNumbers: number[];
    context?: Record<string, any>;
}

export interface WarningRegistry {
    warnings: CodeWarning[];
    register: (warning: CodeWarning) => void;
    unregister: (id: string) => void;
    scan: (sql: string) => WarningResult[];
}

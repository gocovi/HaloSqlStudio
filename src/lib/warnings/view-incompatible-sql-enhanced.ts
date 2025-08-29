import type { CodeWarning } from "./types";

export const viewIncompatibleSqlWarning: CodeWarning = {
    id: "view-incompatible-sql",
    title: "View-Incompatible SQL Features",
    description:
        "This SQL contains features that don't work in views or Halo's reporting engine. Common issues: ORDER BY, WITH clauses (CTEs), window functions, TOP/LIMIT, OFFSET, table hints, dynamic SQL, and temporary tables. Restructure your query to remove these features.",
    severity: "error",
    category: "compatibility",

    test: (sql: string): boolean => {
        const upperSql = sql.toUpperCase();

        // Check for ORDER BY (not allowed in views)
        if (upperSql.includes("ORDER BY")) {
            return true;
        }

        // Check for WITH clause (CTEs - not allowed in views)
        if (upperSql.includes("WITH ") && upperSql.includes(" AS (")) {
            return true;
        }

        // Check for window functions (not allowed in views)
        const windowFunctions = [
            "ROW_NUMBER()",
            "RANK()",
            "DENSE_RANK()",
            "NTILE(",
            "LAG(",
            "LEAD(",
            "FIRST_VALUE(",
            "LAST_VALUE(",
            "NTH_VALUE(",
            "PERCENT_RANK(",
            "CUME_DIST(",
        ];

        for (const func of windowFunctions) {
            if (upperSql.includes(func)) {
                return true;
            }
        }

        // Check for OFFSET clause (not allowed in views)
        if (upperSql.includes("OFFSET ")) {
            return true;
        }

        // Check for FETCH clause (not allowed in views)
        if (upperSql.includes("FETCH ")) {
            return true;
        }

        // Check for FOR UPDATE (not allowed in views)
        if (upperSql.includes("FOR UPDATE")) {
            return true;
        }

        // Check for OPTION clause (SQL Server specific, not allowed in views)
        if (upperSql.includes("OPTION (")) {
            return true;
        }

        // Check for table hints (not allowed in views)
        if (upperSql.includes("WITH (") && upperSql.includes("INDEX(")) {
            return true;
        }

        // Check for dynamic SQL (not allowed in views)
        if (upperSql.includes("EXEC(") || upperSql.includes("EXECUTE(")) {
            return true;
        }

        // Check for temporary tables (not allowed in views)
        if (
            upperSql.includes("#") ||
            upperSql.includes("TEMP") ||
            upperSql.includes("TEMPORARY")
        ) {
            return true;
        }

        return false;
    },

    // No auto-fix available - these require manual SQL restructuring
    fix: undefined,
};

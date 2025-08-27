import { useState, useCallback, useMemo } from "react";
import type { QueryResult } from "@/services/api/types";

export function useResultsSorting(result: QueryResult) {
    const [sortConfig, setSortConfig] = useState<{
        key: string;
        direction: "asc" | "desc";
    } | null>(null);

    // Handle column sorting
    const handleSort = useCallback((columnName: string) => {
        setSortConfig((prev) => {
            if (prev?.key === columnName) {
                // If clicking the same column, toggle direction
                const newDirection = prev.direction === "asc" ? "desc" : "asc";
                return {
                    key: columnName,
                    direction: newDirection,
                };
            } else {
                // If clicking a new column, start with ascending
                return {
                    key: columnName,
                    direction: "asc",
                };
            }
        });
    }, []);

    // Sort rows based on current sort configuration
    const sortedRows = useMemo(() => {
        if (!result?.rows || !sortConfig) return result?.rows || [];

        const sorted = [...result.rows].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            // Handle null/undefined values
            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;

            // Convert to strings for comparison
            const aStr = String(aValue).toLowerCase();
            const bStr = String(bValue).toLowerCase();

            if (sortConfig.direction === "asc") {
                return aStr.localeCompare(bStr);
            } else {
                return bStr.localeCompare(aStr);
            }
        });

        return sorted;
    }, [result?.rows, sortConfig]);

    return {
        sortConfig,
        handleSort,
        sortedRows,
    };
}

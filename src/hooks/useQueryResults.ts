import { useState, useCallback } from "react";
import type { QueryResult } from "@/lib/halo-api";
import {
    exportToJSON,
    exportToCSV,
    copyRowToClipboard,
} from "@/lib/export-utils";

interface UseQueryResultsOptions {
    result: QueryResult | null;
}

export function useQueryResults({ result }: UseQueryResultsOptions) {
    const [copiedRowIndex, setCopiedRowIndex] = useState<number | null>(null);

    const handleCopyRow = useCallback(
        async (row: Record<string, string>, columns: { name: string }[]) => {
            try {
                await copyRowToClipboard(row, columns);
                const rowIndex = result?.rows.indexOf(row);
                if (rowIndex !== undefined) {
                    setCopiedRowIndex(rowIndex);
                    setTimeout(() => setCopiedRowIndex(null), 2000);
                }
            } catch (error) {
                console.error("Failed to copy row:", error);
            }
        },
        [result?.rows]
    );

    const handleExportJSON = useCallback(() => {
        if (!result) return;
        exportToJSON(result);
    }, [result]);

    const handleExportCSV = useCallback(() => {
        if (!result) return;
        exportToCSV(result);
    }, [result]);

    const canExport = result && !result.hasError;

    return {
        // State
        copiedRowIndex,

        // Actions
        handleCopyRow,
        handleExportJSON,
        handleExportCSV,

        // Computed
        canExport,
        rowCount: result?.rows.length || 0,
        columnCount: result?.columns.length || 0,
        executionTime: result?.executionTime,
        hasError: result?.hasError || false,
        error: result?.error,
    };
}

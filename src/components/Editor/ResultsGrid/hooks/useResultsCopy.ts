import { useState, useCallback } from "react";
import { copyRowToClipboard } from "@/lib/export-utils";

export function useResultsCopy() {
    const [copiedRowIndex, setCopiedRowIndex] = useState<number | null>(null);
    const [copiedCell, setCopiedCell] = useState<{
        rowIndex: number;
        colIndex: number;
    } | null>(null);

    // Copy row to clipboard with feedback
    const handleCopyRow = useCallback(
        async (row: Record<string, string>, columns: { name: string }[]) => {
            const success = await copyRowToClipboard(row, columns);
            if (success) {
                // Show success feedback
                const rowIndex = 0; // This will be updated by the component using this hook
                setCopiedRowIndex(rowIndex);
                setTimeout(() => setCopiedRowIndex(null), 2000);
            }
        },
        []
    );

    // Copy individual cell to clipboard
    const handleCopyCell = useCallback(
        async (value: string, rowIndex: number, colIndex: number) => {
            try {
                await navigator.clipboard.writeText(value);
                setCopiedCell({ rowIndex, colIndex });
                setTimeout(() => setCopiedCell(null), 2000);
            } catch (error) {
                console.error("Failed to copy to clipboard:", error);
            }
        },
        []
    );

    return {
        copiedRowIndex,
        copiedCell,
        handleCopyRow,
        handleCopyCell,
    };
}

import type { QueryResult } from "./halo-api";

/**
 * Export query results to JSON format
 */
export function exportToJSON(result: QueryResult, filename?: string): void {
    // Don't export if there's an error
    if (result.hasError) {
        throw new Error("Cannot export results with errors");
    }

    const data = {
        columns: result.columns,
        rows: result.rows,
        rowCount: result.rowCount || result.rows.length,
        executionTime: result.executionTime,
        exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
    });
    downloadBlob(blob, filename || `query-result-${Date.now()}.json`);
}

/**
 * Export query results to CSV format
 */
export function exportToCSV(result: QueryResult, filename?: string): void {
    // Don't export if there's an error
    if (result.hasError) {
        throw new Error("Cannot export results with errors");
    }

    const headers = result.columns.map((col) => col.name).join(",");
    const rows = result.rows
        .map((row) =>
            result.columns
                .map((col) => {
                    const value = row[col.name];
                    if (value === null || value === undefined) return "";

                    // Escape commas and quotes in CSV
                    const stringValue = String(value);
                    if (
                        stringValue.includes(",") ||
                        stringValue.includes('"') ||
                        stringValue.includes("\n")
                    ) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                })
                .join(",")
        )
        .join("\n");

    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: "text/csv" });
    downloadBlob(blob, filename || `query-result-${Date.now()}.csv`);
}

/**
 * Helper function to download a blob
 */
function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Copy a row to clipboard
 */
export async function copyRowToClipboard(
    row: any,
    columns: any[]
): Promise<boolean> {
    try {
        const rowData = columns
            .map((col) => `${col.name}: ${row[col.name] || "NULL"}`)
            .join("\t");
        await navigator.clipboard.writeText(rowData);
        return true;
    } catch (err) {
        console.error("Failed to copy row:", err);
        return false;
    }
}

/**
 * Copy query results to clipboard as formatted text
 */
export async function copyResultsToClipboard(
    result: QueryResult
): Promise<boolean> {
    try {
        const headers = result.columns.map((col) => col.name).join("\t");
        const rows = result.rows
            .map((row) =>
                result.columns.map((col) => row[col.name] || "NULL").join("\t")
            )
            .join("\n");

        const text = `${headers}\n${rows}`;
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error("Failed to copy results:", err);
        return false;
    }
}

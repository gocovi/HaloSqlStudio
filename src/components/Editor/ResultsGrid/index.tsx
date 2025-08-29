import { ResultsHeader } from "./ResultsHeader";
import { ResultsTable } from "./ResultsTable";
import { useEditorStore } from "../store/editorStore";
import type { QueryResult } from "@/services/api/types";

interface ResultsGridProps {
    result: QueryResult | null;
    loading?: boolean;
    error?: string;
}

export function ResultsGrid({ result, loading, error }: ResultsGridProps) {
    const { activeTabId, setGlobalFilter, clearGlobalFilter } =
        useEditorStore();

    // Get the current tab's global filter from the store
    const currentTab = useEditorStore((state) =>
        state.tabs.find((tab) => tab.id === activeTabId)
    );
    const globalFilter = currentTab?.globalFilter || "";

    if (loading) {
        return (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2">Executing query...</span>
            </div>
        );
    }

    if (error || result?.hasError) {
        const errorMessage =
            error || result?.error || "An unknown error occurred";
        return (
            <div className="p-4 border border-destructive bg-destructive/10 rounded text-destructive text-sm">
                <strong>SQL Error:</strong> {errorMessage}
            </div>
        );
    }

    if (!result) {
        return (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
                No query executed
            </div>
        );
    }

    return (
        <div className="grid grid-rows-[auto_1fr_auto] h-full gap-0 min-h-0">
            <ResultsHeader
                result={result}
                globalFilter={globalFilter}
                onGlobalFilterChange={(filter) =>
                    setGlobalFilter(activeTabId, filter)
                }
            />

            <div className="min-h-0 overflow-hidden">
                <ResultsTable result={result} />
            </div>

            {/* Footer with row count and query time */}
            <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground border-t border-border bg-muted/30">
                <div className="flex items-center gap-4">
                    {/* Row count */}
                    <span>{result.rowCount || result.rows.length} rows</span>

                    {/* Query execution time */}
                    {result.executionTime && (
                        <span>{result.executionTime}ms</span>
                    )}
                </div>

                {/* Right side footer content (can be expanded later) */}
                <div className="flex items-center gap-2">
                    {/* Future: Could add pagination info, data source, etc. */}
                </div>
            </div>
        </div>
    );
}

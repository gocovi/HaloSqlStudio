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
        <div className="grid grid-rows-[auto_1fr] h-full gap-0 min-h-0">
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
        </div>
    );
}

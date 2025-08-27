import { useState } from "react";
import { SqlEditor } from "./SqlEditor";
import { ResultsGrid } from "./ResultsGrid";
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "./ui/resizable";
import type { QueryResult, TableInfo } from "@/lib/halo-api";

interface QueryTabProps {
    initialSql?: string;
    onExecute?: (sql: string) => Promise<QueryResult>;
    onContentChange?: (sql: string) => void;
    onSave?: (sql: string) => void;
    sqlContent?: string;
}

export function QueryTab({
    initialSql,
    onExecute,
    onContentChange,
    onSave,
    sqlContent,
}: QueryTabProps) {
    const [result, setResult] = useState<QueryResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleExecute = async (sql: string) => {
        if (!onExecute) return;

        setLoading(true);
        setError(null);

        try {
            const startTime = Date.now();
            const queryResult = await onExecute(sql);
            const executionTime = Date.now() - startTime;

            setResult({
                ...queryResult,
                executionTime,
                rowCount: queryResult.rows.length,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    // Use onSave if provided, otherwise fall back to onContentChange
    const handleSave = onSave || onContentChange;

    return (
        <div className="flex flex-col h-full">
            <ResizablePanelGroup direction="vertical" className="h-full">
                {/* Editor Section */}
                <ResizablePanel defaultSize={50} minSize={20}>
                    <SqlEditor
                        initialSql={sqlContent || initialSql}
                        onExecute={handleExecute}
                        onContentChange={onContentChange}
                        onSave={handleSave}
                    />
                </ResizablePanel>

                {/* Resizable Handle */}
                <ResizableHandle withHandle />

                {/* Results Section */}
                <ResizablePanel defaultSize={50} minSize={20}>
                    <ResultsGrid
                        result={result}
                        loading={loading}
                        error={error}
                    />
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}

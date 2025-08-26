import { useState } from "react";
import { SqlEditor } from "./SqlEditor";
import { ResultsGrid } from "./ResultsGrid";
import type { QueryResult } from "@/lib/halo-api";

interface QueryTabProps {
    initialSql?: string;
    onExecute?: (sql: string) => Promise<QueryResult>;
    onContentChange?: (sql: string) => void;
    sqlContent?: string;
}

export function QueryTab({
    initialSql,
    onExecute,
    onContentChange,
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

    return (
        <div className="flex flex-col h-full">
            {/* Editor Section */}
            <div className="h-1/2 border-b border-border">
                <SqlEditor
                    initialSql={sqlContent || initialSql}
                    onExecute={handleExecute}
                    onContentChange={onContentChange}
                />
            </div>

            {/* Results Section */}
            <div className="h-1/2">
                <ResultsGrid result={result} loading={loading} error={error} />
            </div>
        </div>
    );
}

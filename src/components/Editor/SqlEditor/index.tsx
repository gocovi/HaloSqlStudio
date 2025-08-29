import { useEffect, lazy, Suspense } from "react";
import { useSqlEditor } from "./hooks/useSqlEditor";

// Lazy load Monaco Editor to reduce initial bundle size
const MonacoWrapper = lazy(() =>
    import("./MonacoWrapper").then((module) => ({
        default: module.MonacoWrapper,
    }))
);

interface SqlEditorProps {
    sql: string;
    onContentChange: (sql: string) => void;
    isReport?: boolean;
    originalSql?: string; // For reports, this is the original SQL from the database
}

export function SqlEditor({
    sql,
    onContentChange,
    isReport = false,
    originalSql,
}: SqlEditorProps) {
    const { hasUnsavedChanges, handleEditorChange } = useSqlEditor({
        initialSql: sql,
        onContentChange,
        originalSql,
    });

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 min-h-0">
                <Suspense
                    fallback={
                        <div className="flex items-center justify-center h-full bg-muted/20">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                                <p className="text-sm text-muted-foreground">
                                    Loading SQL Editor...
                                </p>
                            </div>
                        </div>
                    }
                >
                    <MonacoWrapper
                        value={sql}
                        onChange={handleEditorChange}
                        readOnly={false}
                    />
                </Suspense>
            </div>
        </div>
    );
}

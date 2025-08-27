import { useEffect } from "react";
import { MonacoWrapper } from "./MonacoWrapper";
import { useSqlEditor } from "./hooks/useSqlEditor";

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
                <MonacoWrapper
                    value={sql}
                    onChange={handleEditorChange}
                    readOnly={false}
                />
            </div>
        </div>
    );
}

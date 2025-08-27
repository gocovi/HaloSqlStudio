import { useEffect } from "react";
import { MonacoWrapper } from "./MonacoWrapper";
import { useSqlEditor } from "./hooks/useSqlEditor";

interface SqlEditorProps {
    onExecute?: (sql: string) => void;
    initialSql?: string;
    readOnly?: boolean;
    onContentChange?: (sql: string) => void;
    onSave?: (sql: string) => void;
    onSavingChange?: (isSaving: boolean) => void;
}

export function SqlEditor({
    onExecute,
    initialSql = "",
    readOnly = false,
    onContentChange,
    onSave,
    onSavingChange,
}: SqlEditorProps) {
    const {
        sql,
        hasUnsavedChanges,
        isSaving,
        handleEditorChange,
        handleSave,
        handleExecute,
    } = useSqlEditor({
        initialSql,
        onExecute,
        onContentChange,
        onSave,
    });

    // Notify parent when saving state changes
    useEffect(() => {
        if (onSavingChange) {
            onSavingChange(isSaving);
        }
    }, [isSaving, onSavingChange]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 min-h-0">
                <MonacoWrapper
                    value={sql}
                    onChange={handleEditorChange}
                    readOnly={readOnly}
                    onSave={handleSave}
                />
            </div>
        </div>
    );
}

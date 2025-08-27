import { useState, useCallback, useRef, useEffect } from "react";

interface UseSqlEditorProps {
    initialSql: string;
    onExecute?: (sql: string) => void;
    onContentChange?: (sql: string) => void;
    onSave?: (sql: string) => void;
}

export function useSqlEditor({
    initialSql,
    onExecute,
    onContentChange,
    onSave,
}: UseSqlEditorProps) {
    const [sql, setSql] = useState(initialSql);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const debounceTimeoutRef = useRef<NodeJS.Timeout>();
    const lastSavedContent = useRef(initialSql);

    // Update local state when initialSql changes (e.g., when switching tabs)
    useEffect(() => {
        setSql(initialSql);
        lastSavedContent.current = initialSql;
        setHasUnsavedChanges(false);
    }, [initialSql]);

    // Debounced autosave function
    const debouncedAutosave = useCallback(
        (value: string) => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }

            debounceTimeoutRef.current = setTimeout(() => {
                if (onContentChange && value !== lastSavedContent.current) {
                    setIsSaving(true);
                    onContentChange(value);
                    lastSavedContent.current = value;
                    setHasUnsavedChanges(false);
                    // Simulate a brief save operation
                    setTimeout(() => setIsSaving(false), 300);
                }
            }, 1000); // 1 second delay
        },
        [onContentChange]
    );

    // Handle editor content changes
    const handleEditorChange = useCallback(
        (value: string | undefined) => {
            const newValue = value || "";
            setSql(newValue);
            setHasUnsavedChanges(newValue !== lastSavedContent.current);

            // Trigger debounced autosave
            debouncedAutosave(newValue);
        },
        [debouncedAutosave]
    );

    // Manual save function
    const handleSave = useCallback(() => {
        if (onSave) {
            onSave(sql);
        } else if (onContentChange) {
            onContentChange(sql);
        }
        lastSavedContent.current = sql;
        setHasUnsavedChanges(false);
    }, [sql, onSave, onContentChange]);

    // Handle execute
    const handleExecute = useCallback(() => {
        if (onExecute && sql.trim()) {
            onExecute(sql);
        }
    }, [onExecute, sql]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

    return {
        sql,
        hasUnsavedChanges,
        isSaving,
        handleEditorChange,
        handleSave,
        handleExecute,
    };
}

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Save } from "lucide-react";
import Editor from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import * as monaco from "monaco-editor";
import { useTables } from "@/contexts/TablesContext";
import type { TableInfo } from "@/lib/halo-api";

// Extend Window interface for global table access
declare global {
    interface Window {
        __HALO_TABLES__: TableInfo[];
    }
}

interface SqlEditorProps {
    onExecute?: (sql: string) => void;
    initialSql?: string;
    readOnly?: boolean;
    onContentChange?: (sql: string) => void;
    onSave?: (sql: string) => void;
}

export function SqlEditor({
    onExecute,
    initialSql = "",
    readOnly = false,
    onContentChange,
    onSave,
}: SqlEditorProps) {
    const { tables } = useTables();
    const [sql, setSql] = useState(initialSql);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const debounceTimeoutRef = useRef<NodeJS.Timeout>();
    const lastSavedContent = useRef(initialSql);

    // Debounced autosave function
    const debouncedAutosave = useCallback(
        (value: string) => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }

            debounceTimeoutRef.current = setTimeout(() => {
                if (onContentChange && value !== lastSavedContent.current) {
                    onContentChange(value);
                    lastSavedContent.current = value;
                    setHasUnsavedChanges(false);
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

    // Update local state when initialSql changes (e.g., when switching tabs)
    const handleEditorDidMount = useCallback(
        (editor: editor.IStandaloneCodeEditor) => {
            editor.updateOptions({
                theme: "vs-dark",
            });

            // Add keyboard shortcut for save (Ctrl+S)
            editor.addCommand(
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
                () => {
                    handleSave();
                }
            );

            // Update last saved content when editor mounts
            lastSavedContent.current = initialSql;
            setHasUnsavedChanges(false);
        },
        [initialSql, handleSave]
    );

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center gap-0 border-b border-border bg-card h-12">
                <Button
                    size="sm"
                    onClick={handleExecute}
                    disabled={!sql.trim() || readOnly}
                    className="bg-success hover:bg-success/90 text-white rounded-none h-12 w-12 p-0"
                    title="Execute Query"
                >
                    <Play className="h-4 w-4" />
                </Button>

                {onSave && (
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={!hasUnsavedChanges || readOnly}
                        variant={hasUnsavedChanges ? "default" : "outline"}
                        className="rounded-none h-12 w-12 p-0"
                        title="Save Changes (Ctrl+S)"
                    >
                        <Save className="h-4 w-4" />
                    </Button>
                )}

                {hasUnsavedChanges && (
                    <div className="ml-2 text-xs text-muted-foreground flex items-center gap-1">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        {onSave ? "Unsaved changes" : "Auto-saving..."}
                    </div>
                )}
            </div>

            {/* Editor */}
            <div className="flex-1">
                <Editor
                    height="100%"
                    defaultLanguage="sql"
                    value={sql}
                    onChange={handleEditorChange}
                    options={{
                        readOnly,
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: "on",
                        roundedSelection: false,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        theme: "vs-dark",
                        ariaLabel: "SQL Editor",
                        suggestOnTriggerCharacters: true,
                        quickSuggestions: true,
                        wordBasedSuggestions: "off",
                        acceptSuggestionOnEnter: "off",
                        suggest: {
                            showKeywords: true,
                            showSnippets: true,
                            showClasses: true,
                            showFunctions: true,
                            showVariables: true,
                            showConstants: true,
                            showEnums: true,
                            showModules: true,
                            showProperties: true,
                            showEvents: true,
                            showOperators: true,
                            showUnits: true,
                            showValues: true,
                            showColors: true,
                            showFiles: true,
                            showReferences: true,
                            showFolders: true,
                            showTypeParameters: true,
                            showWords: true,
                            showUsers: true,
                            showIssues: true,
                        },
                    }}
                    beforeMount={(monaco) => {
                        monaco.editor.defineTheme("vs-dark", {
                            base: "vs-dark",
                            inherit: true,
                            rules: [],
                            colors: {},
                        });

                        // Register completion provider for SQL language
                        const completionProvider = {
                            triggerCharacters: [".", " ", "\n", "\t"],
                            provideCompletionItems: (
                                model: editor.ITextModel,
                                position: monaco.Position
                            ) => {
                                const suggestions: monaco.languages.CompletionItem[] =
                                    [];

                                // Create a range for the current word position
                                const range = {
                                    startLineNumber: position.lineNumber,
                                    startColumn: position.column,
                                    endLineNumber: position.lineNumber,
                                    endColumn: position.column,
                                };

                                // SQL Keywords
                                const sqlKeywords = [
                                    "SELECT",
                                    "FROM",
                                    "WHERE",
                                    "JOIN",
                                    "LEFT",
                                    "RIGHT",
                                    "INNER",
                                    "OUTER",
                                    "ON",
                                    "AND",
                                    "OR",
                                    "NOT",
                                    "IN",
                                    "EXISTS",
                                    "GROUP BY",
                                    "ORDER BY",
                                    "HAVING",
                                    "LIMIT",
                                    "OFFSET",
                                    "DISTINCT",
                                    "COUNT",
                                    "SUM",
                                    "AVG",
                                    "MIN",
                                    "MAX",
                                    "CASE",
                                    "WHEN",
                                    "THEN",
                                    "ELSE",
                                    "END",
                                    "AS",
                                    "ASC",
                                    "DESC",
                                    "NULL",
                                    "IS NULL",
                                    "IS NOT NULL",
                                    "LIKE",
                                    "ILIKE",
                                    "BETWEEN",
                                    "UNION",
                                    "ALL",
                                ];

                                // Add SQL keywords
                                sqlKeywords.forEach((keyword) => {
                                    suggestions.push({
                                        label: keyword,
                                        kind: monaco.languages
                                            .CompletionItemKind.Keyword,
                                        insertText: keyword,
                                        detail: "SQL Keyword",
                                        sortText: "0" + keyword,
                                        range: range,
                                    });
                                });

                                // Add table names - access tables from global context
                                const currentTables =
                                    window.__HALO_TABLES__ || [];
                                currentTables.forEach((table: TableInfo) => {
                                    suggestions.push({
                                        label: table.name,
                                        kind: monaco.languages
                                            .CompletionItemKind.Class,
                                        insertText: table.name,
                                        detail: "Table",
                                        sortText: "1" + table.name,
                                        range: range,
                                        documentation: {
                                            value: `Table: ${
                                                table.name
                                            }\nColumns: ${table.columns
                                                .map((col) => col.name)
                                                .join(", ")}`,
                                        },
                                    });

                                    // Add column names with table prefix
                                    table.columns.forEach((column) => {
                                        suggestions.push({
                                            label: `${table.name}.${column.name}`,
                                            kind: monaco.languages
                                                .CompletionItemKind.Field,
                                            insertText: `${table.name}.${column.name}`,
                                            detail: `Column (${column.data_type})`,
                                            sortText:
                                                "2" +
                                                `${table.name}.${column.name}`,
                                            range: range,
                                            documentation: {
                                                value: `Column: ${column.name}\nType: ${column.data_type}\nTable: ${table.name}`,
                                            },
                                        });

                                        // Also add just the column name
                                        suggestions.push({
                                            label: column.name,
                                            kind: monaco.languages
                                                .CompletionItemKind.Field,
                                            insertText: column.name,
                                            detail: `Column (${column.data_type})`,
                                            sortText: "3" + column.name,
                                            range: range,
                                            documentation: {
                                                value: `Column: ${column.name}\nType: ${column.data_type}\nTable: ${table.name}`,
                                            },
                                        });
                                    });
                                });

                                return { suggestions };
                            },
                        };

                        monaco.languages.registerCompletionItemProvider(
                            "sql",
                            completionProvider
                        );
                    }}
                    onMount={handleEditorDidMount}
                />
            </div>
        </div>
    );
}

import { useCallback, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import * as monaco from "monaco-editor";
import { useMonacoSetup } from "./hooks/useMonacoSetup";
import type { TableInfo } from "@/services/api/types";

// Extend Window interface for global table access
declare global {
    interface Window {
        __HALO_TABLES__: TableInfo[];
        monaco: typeof monaco;
    }
}

interface MonacoWrapperProps {
    value: string;
    onChange: (value: string | undefined) => void;
    readOnly: boolean;
    onSave: () => void;
}

export function MonacoWrapper({
    value,
    onChange,
    readOnly,
    onSave,
}: MonacoWrapperProps) {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const disposableRef = useRef<{ dispose?: () => void } | null>(null);
    const { setupMonaco } = useMonacoSetup();

    const handleEditorDidMount = useCallback(
        (editor: editor.IStandaloneCodeEditor) => {
            editorRef.current = editor;

            // Setup Monaco with our custom configuration
            setupMonaco(editor);

            // Listen for custom save and execute events using command service
            try {
                editor.addCommand(
                    monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
                    () => {
                        onSave();
                    }
                );
            } catch (error) {
                console.warn("Failed to add command binding:", error);
            }
        },
        [setupMonaco, onSave]
    );

    // Cleanup disposable on unmount
    useEffect(() => {
        return () => {
            if (
                disposableRef.current &&
                typeof disposableRef.current.dispose === "function"
            ) {
                disposableRef.current.dispose();
            }
        };
    }, []);

    const handleEditorChange = useCallback(
        (value: string | undefined) => {
            onChange(value);
        },
        [onChange]
    );

    return (
        <Editor
            height="100%"
            defaultLanguage="sql"
            value={value}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
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
                                kind: monaco.languages.CompletionItemKind
                                    .Keyword,
                                insertText: keyword,
                                detail: "SQL Keyword",
                                sortText: "0" + keyword,
                                range: range,
                            });
                        });

                        // Add table names - access tables from global context
                        const currentTables = window.__HALO_TABLES__ || [];
                        currentTables.forEach((table: TableInfo) => {
                            suggestions.push({
                                label: table.name,
                                kind: monaco.languages.CompletionItemKind.Class,
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
                                    kind: monaco.languages.CompletionItemKind
                                        .Field,
                                    insertText: `${table.name}.${column.name}`,
                                    detail: `Column (${column.data_type})`,
                                    sortText:
                                        "2" + `${table.name}.${column.name}`,
                                    range: range,
                                    documentation: {
                                        value: `Column: ${column.name}\nType: ${column.data_type}\nTable: ${table.name}`,
                                    },
                                });

                                // Also add just the column name
                                suggestions.push({
                                    label: column.name,
                                    kind: monaco.languages.CompletionItemKind
                                        .Field,
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
            options={{
                padding: { top: 24, bottom: 24 },
                readOnly,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineNumbers: "on",
                roundedSelection: false,
                scrollbar: {
                    vertical: "visible",
                    horizontal: "visible",
                },
                automaticLayout: true,
                wordWrap: "on",
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                parameterHints: {
                    enabled: true,
                },
                hover: {
                    enabled: true,
                },
                contextmenu: true,
                folding: true,
                foldingStrategy: "indentation",
                showFoldingControls: "always",
                matchBrackets: "always",
                autoClosingBrackets: "always",
                autoClosingQuotes: "always",
                autoClosingOvertype: "always",
                autoSurround: "quotes",
                tabSize: 4,
                insertSpaces: true,
                detectIndentation: false,
                trimAutoWhitespace: true,
                largeFileOptimizations: true,
                suggest: {
                    insertMode: "replace",
                    showKeywords: true,
                    showSnippets: true,
                    showClasses: true,
                    showFunctions: true,
                    showVariables: true,
                    showConstants: true,
                    showFields: true,
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
        />
    );
}

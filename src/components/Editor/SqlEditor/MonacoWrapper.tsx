import { useCallback, useRef, useEffect, Suspense, lazy } from "react";
import type { editor } from "monaco-editor";
import * as monaco from "monaco-editor";
import { useMonacoSetup } from "./hooks/useMonacoSetup";
import type { TableInfo } from "@/services/api/types";

// Lazy load Monaco Editor to reduce initial bundle size
const Editor = lazy(() => import("@monaco-editor/react"));

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
        <Suspense fallback={<div>Loading Monaco Editor...</div>}>
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
                        provideCompletionItems: (model, position) => {
                            const suggestions: monaco.languages.CompletionItem[] =
                                [];

                            // Get the current word being typed - more reliable approach
                            const word = model.getWordAtPosition(position);
                            let currentWord = "";
                            let wordRange = null;

                            if (word) {
                                // Get the word at the current position
                                currentWord = word.word.toLowerCase();
                                // Calculate the word range
                                wordRange = {
                                    startLineNumber: position.lineNumber,
                                    startColumn: word.startColumn,
                                    endLineNumber: position.lineNumber,
                                    endColumn: word.endColumn,
                                };
                            } else {
                                // Fallback: get word until position (for when typing)
                                const wordUntil =
                                    model.getWordUntilPosition(position);
                                currentWord = wordUntil.word.toLowerCase();
                            }

                            // Skip if currentWord is too short (less than 1 character)
                            if (currentWord.length < 1) {
                                return { suggestions: [] };
                            }

                            // Create a range for the current word position
                            let range;
                            if (wordRange) {
                                // Use the actual word range when available
                                range = wordRange;
                            } else {
                                // Fallback to cursor position
                                range = {
                                    startLineNumber: position.lineNumber,
                                    startColumn: position.column,
                                    endLineNumber: position.lineNumber,
                                    endColumn: position.column,
                                };
                            }

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

                            // Add table names FIRST - highest priority
                            const currentTables = window.__HALO_TABLES__ || [];
                            currentTables.forEach((table: TableInfo) => {
                                const tableName = table.name;
                                const tableNameLower = tableName.toLowerCase();

                                // Only add tables that actually match what's being typed
                                if (tableNameLower.startsWith(currentWord)) {
                                    suggestions.push({
                                        label: tableName,
                                        kind: monaco.languages
                                            .CompletionItemKind.Class,
                                        insertText: tableName,
                                        detail: "Table",
                                        sortText: `A${tableName}`,
                                        range: range,
                                        documentation: {
                                            value: `Table: ${tableName}\nColumns: ${table.columns
                                                .map((col) => col.name)
                                                .join(", ")}`,
                                        },
                                    });

                                    // Add column names with table prefix
                                    table.columns.forEach((column) => {
                                        const columnName = column.name;
                                        const columnNameLower =
                                            columnName.toLowerCase();
                                        const fullName = `${tableName}.${columnName}`;
                                        const fullNameLower =
                                            fullName.toLowerCase();

                                        // Only add table.column combinations that match what's being typed
                                        if (
                                            fullNameLower.startsWith(
                                                currentWord
                                            )
                                        ) {
                                            suggestions.push({
                                                label: fullName,
                                                kind: monaco.languages
                                                    .CompletionItemKind.Field,
                                                insertText: fullName,
                                                detail: `Column (${column.data_type})`,
                                                sortText: `B${fullName}`,
                                                range: range,
                                                documentation: {
                                                    value: `Column: ${columnName}\nType: ${column.data_type}\nTable: ${tableName}`,
                                                },
                                            });
                                        }

                                        // Only add individual column names that match what's being typed
                                        if (
                                            columnNameLower.startsWith(
                                                currentWord
                                            )
                                        ) {
                                            suggestions.push({
                                                label: columnName,
                                                kind: monaco.languages
                                                    .CompletionItemKind.Field,
                                                insertText: columnName,
                                                detail: `Column (${column.data_type})`,
                                                sortText: `C${columnName}`,
                                                range: range,
                                                documentation: {
                                                    value: `Column: ${columnName}\nType: ${column.data_type}\nTable: ${tableName}`,
                                                },
                                            });
                                        }
                                    });
                                }
                            });

                            // Add SQL keywords LAST - lowest priority
                            sqlKeywords.forEach((keyword) => {
                                const keywordLower = keyword.toLowerCase();

                                // Only show keywords if they start with what's being typed
                                if (keywordLower.startsWith(currentWord)) {
                                    suggestions.push({
                                        label: keyword,
                                        kind: monaco.languages
                                            .CompletionItemKind.Keyword,
                                        insertText: keyword,
                                        detail: "SQL Keyword",
                                        sortText: `D${keyword}`,
                                        range: range,
                                    });
                                }
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
                    acceptSuggestionOnEnter: "off",
                    tabCompletion: "on",
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
                    quickSuggestionsDelay: 0,
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
                }}
            />
        </Suspense>
    );
}

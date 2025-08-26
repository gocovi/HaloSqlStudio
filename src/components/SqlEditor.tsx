import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import Editor from "@monaco-editor/react";

interface SqlEditorProps {
    onExecute?: (sql: string) => void;
    initialSql?: string;
    readOnly?: boolean;
    onContentChange?: (sql: string) => void;
}

export function SqlEditor({
    onExecute,
    initialSql = "",
    readOnly = false,
    onContentChange,
}: SqlEditorProps) {
    const [sql, setSql] = useState(initialSql);

    const handleExecute = () => {
        if (onExecute && sql.trim()) {
            onExecute(sql);
        }
    };

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
            </div>

            {/* Editor */}
            <div className="flex-1">
                <Editor
                    height="100%"
                    defaultLanguage="sql"
                    value={sql}
                    onChange={(value) => {
                        const newValue = value || "";
                        setSql(newValue);
                        onContentChange?.(newValue);
                    }}
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
                    }}
                    beforeMount={(monaco) => {
                        monaco.editor.defineTheme("vs-dark", {
                            base: "vs-dark",
                            inherit: true,
                            rules: [],
                            colors: {},
                        });
                    }}
                    onMount={(editor) => {
                        editor.updateOptions({
                            theme: "vs-dark",
                        });
                    }}
                />
            </div>
        </div>
    );
}

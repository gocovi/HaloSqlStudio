import { Play, Loader2, Settings, ChevronDown } from "lucide-react";

interface EditorToolbarProps {
    isSaving: boolean;
    onExecute: () => void;
    readOnly: boolean;
}

export function EditorToolbar({
    isSaving,
    onExecute,
    readOnly,
}: EditorToolbarProps) {
    return (
        <div className="flex items-center justify-between p-2 border-b border-border bg-card">
            <div className="flex items-center gap-4">
                {/* Execute button - simple icon style */}
                <button
                    onClick={onExecute}
                    disabled={readOnly}
                    className="flex items-center justify-center h-8 w-8 rounded hover:bg-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title={
                        readOnly
                            ? "Cannot execute in read-only mode"
                            : "Execute query (Ctrl+Enter)"
                    }
                >
                    <Play className="h-5 w-5 text-green-500" />
                </button>

                {isSaving && (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                )}
            </div>
        </div>
    );
}

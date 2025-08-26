import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Save, FileText } from "lucide-react";

interface SqlEditorProps {
  onExecute?: (sql: string) => void;
  initialSql?: string;
  readOnly?: boolean;
}

export function SqlEditor({ onExecute, initialSql = "", readOnly = false }: SqlEditorProps) {
  const [sql, setSql] = useState(initialSql);

  const handleExecute = () => {
    if (onExecute && sql.trim()) {
      onExecute(sql);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b border-border bg-card">
        <Button 
          size="sm" 
          onClick={handleExecute}
          disabled={!sql.trim() || readOnly}
          className="bg-success hover:bg-success/90 text-white"
        >
          <Play className="h-3 w-3 mr-1" />
          Execute
        </Button>
        <Button size="sm" variant="outline">
          <Save className="h-3 w-3 mr-1" />
          Save
        </Button>
        <Button size="sm" variant="outline">
          <FileText className="h-3 w-3 mr-1" />
          Format
        </Button>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          readOnly={readOnly}
          className="w-full h-full p-4 bg-editor-background text-foreground font-mono text-sm resize-none border-none outline-none"
          placeholder="-- Enter your SQL query here..."
          spellCheck={false}
        />
      </div>
    </div>
  );
}
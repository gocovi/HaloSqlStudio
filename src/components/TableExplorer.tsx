import { useState } from "react";
import { ChevronRight, ChevronDown, Table, Database, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Column {
  name: string;
  type: string;
  nullable: boolean;
}

interface TableInfo {
  name: string;
  columns: Column[];
}

interface TableExplorerProps {
  tables: TableInfo[];
  onTableSelect?: (tableName: string) => void;
  onColumnSelect?: (tableName: string, columnName: string) => void;
}

export function TableExplorer({ tables, onTableSelect, onColumnSelect }: TableExplorerProps) {
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const toggleTable = (tableName: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
    }
    setExpandedTables(newExpanded);
  };

  const filteredTables = tables.filter(table => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return table.name.toLowerCase().includes(query) ||
           table.columns.some(col => col.name.toLowerCase().includes(query));
  });

  return (
    <div className="flex flex-col h-full bg-background border-r border-border">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Database className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">HaloPSA Database</span>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Search tables & columns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-8 text-xs bg-input border-border"
          />
        </div>
      </div>

      {/* Tables List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredTables.map((table) => (
          <div key={table.name} className="mb-1">
            {/* Table Header */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleTable(table.name)}
              className="w-full justify-start p-1 h-auto hover:bg-accent text-xs font-normal"
            >
              {expandedTables.has(table.name) ? (
                <ChevronDown className="h-3 w-3 mr-1" />
              ) : (
                <ChevronRight className="h-3 w-3 mr-1" />
              )}
              <Table className="h-3 w-3 mr-2 text-primary" />
              <span className="truncate">{table.name}</span>
            </Button>

            {/* Columns */}
            {expandedTables.has(table.name) && (
              <div className="ml-6 mt-1">
                {table.columns.map((column) => (
                  <Button
                    key={column.name}
                    variant="ghost"
                    size="sm"
                    onClick={() => onColumnSelect?.(table.name, column.name)}
                    className="w-full justify-start p-1 h-auto hover:bg-accent text-xs font-normal text-muted-foreground"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate">{column.name}</span>
                      <span className="text-xs text-syntax-comment ml-2">
                        {column.type}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
import React, { useMemo } from "react";
import { ChevronRight, ChevronDown, Table, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExplorerStore } from "@/stores/explorerStore";

interface TablesPanelProps {
    onTableSelect?: (tableName: string) => void;
    onColumnSelect?: (tableName: string, columnName: string) => void;
}

export function TablesPanel({
    onTableSelect,
    onColumnSelect,
}: TablesPanelProps) {
    const {
        tables,
        isLoadingTables,
        searchQuery,
        expandedTables,
        toggleTableExpansion,
    } = useExplorerStore();

    // Enhanced search that filters tables and columns
    const filteredTables = useMemo(() => {
        if (!searchQuery.trim()) {
            return tables;
        }

        const query = searchQuery.toLowerCase();

        return tables
            .filter((table) => {
                // Check if table name matches
                const tableMatches = table.name.toLowerCase().includes(query);

                // Check if any columns match
                const hasMatchingColumns = table.columns.some(
                    (col) =>
                        col.name.toLowerCase().includes(query) ||
                        col.data_type.toLowerCase().includes(query)
                );

                return tableMatches || hasMatchingColumns;
            })
            .map((table) => {
                // If searching, filter columns to only show matching ones
                if (searchQuery.trim()) {
                    const filteredColumns = table.columns.filter(
                        (col) =>
                            col.name.toLowerCase().includes(query) ||
                            col.data_type.toLowerCase().includes(query)
                    );
                    return { ...table, columns: filteredColumns };
                }
                return table;
            });
    }, [tables, searchQuery]);

    const handleTableSelect = (tableName: string) => {
        onTableSelect?.(tableName);
    };

    if (isLoadingTables) {
        return (
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin min-h-0">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">
                        Loading tables...
                    </span>
                </div>
            </div>
        );
    }

    if (filteredTables.length === 0 && searchQuery) {
        return (
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin min-h-0">
                <div className="text-center py-8 text-sm text-muted-foreground">
                    No tables found matching "{searchQuery}"
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin min-h-0">
            {filteredTables.map((table) => (
                <div key={table.name} className="mb-1">
                    {/* Table Header */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            toggleTableExpansion(table.name);
                            handleTableSelect(table.name);
                        }}
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
                                    onClick={() =>
                                        onColumnSelect?.(
                                            table.name,
                                            column.name
                                        )
                                    }
                                    className="w-full justify-start p-1 h-auto hover:bg-accent text-xs font-normal text-muted-foreground"
                                >
                                    <span className="truncate">
                                        {column.name} {column.data_type}
                                    </span>
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

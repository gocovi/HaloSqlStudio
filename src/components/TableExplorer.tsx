import React, { useState } from "react";
import {
    ChevronRight,
    ChevronDown,
    Table,
    Database,
    Loader2,
    RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBox } from "@/components/ui/search-box";
import { TableInfo } from "@/lib/halo-api";

interface TableExplorerProps {
    tables: TableInfo[];
    onTableSelect?: (tableName: string) => void;
    onColumnSelect?: (tableName: string, columnName: string) => void;
    onRefresh?: () => void;
    isLoading?: boolean;
}

export function TableExplorer({
    tables,
    onTableSelect,
    onColumnSelect,
    onRefresh,
    isLoading = false,
}: TableExplorerProps) {
    const [expandedTables, setExpandedTables] = useState<Set<string>>(
        new Set()
    );
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

    const filteredTables = tables.filter((table) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            table.name.toLowerCase().includes(query) ||
            table.columns.some((col) => col.name.toLowerCase().includes(query))
        );
    });

    return (
        <div className="flex flex-col h-full bg-background border-r border-border">
            {/* Header */}
            <div className="p-3 border-b border-border">
                <div className="flex items-center gap-2 mb-3">
                    <Database className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">
                        HaloPSA Database
                    </span>
                </div>

                {/* Search */}
                <SearchBox
                    placeholder="Search tables & columns... (Ctrl+F)"
                    value={searchQuery}
                    onChange={setSearchQuery}
                    size="sm"
                    className="w-full"
                    inputClassName="text-xs bg-input border-border"
                    enableKeyboardShortcut={true}
                />
            </div>

            {/* Refresh Button */}
            {onRefresh && (
                <div className="p-2 border-b border-border">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onRefresh}
                        className="w-full justify-center p-2 h-8 hover:bg-accent"
                        disabled={isLoading}
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Tables List */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">
                            Loading tables...
                        </span>
                    </div>
                ) : filteredTables.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                        No tables found
                    </div>
                ) : (
                    filteredTables.map((table) => (
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
                    ))
                )}
            </div>
        </div>
    );
}

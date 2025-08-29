import React, { useState, useMemo } from "react";
import {
    ChevronRight,
    ChevronDown,
    Table,
    Database,
    Loader2,
    RefreshCw,
    FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBox } from "@/components/ui/search-box";
import type { TableInfo, ReportInfo } from "@/services/api/types";

interface ExplorerProps {
    tables: TableInfo[];
    reports: ReportInfo[];
    onTableSelect?: (tableName: string) => void;
    onColumnSelect?: (tableName: string, columnName: string) => void;
    onReportSelect?: (reportId: string) => void;
    onRefresh?: () => void;
    isLoading?: boolean;
    // New props for lazy loading
    onTabChange?: (tab: "tables" | "reports") => void;
    loadTables?: () => Promise<void>;
    loadReports?: () => Promise<void>;
    isTablesLoaded?: boolean;
    isReportsLoaded?: boolean;
    // Individual loading states for better UX
    isLoadingTables?: boolean;
    isLoadingReports?: boolean;
}

export function Explorer({
    tables,
    reports,
    onTableSelect,
    onColumnSelect,
    onReportSelect,
    onRefresh,
    isLoading = false,
    // New props for lazy loading
    onTabChange,
    loadTables,
    loadReports,
    isTablesLoaded = false,
    isReportsLoaded = false,
    // Individual loading states for better UX
    isLoadingTables = false,
    isLoadingReports = false,
}: ExplorerProps) {
    const [expandedTables, setExpandedTables] = useState<Set<string>>(
        new Set()
    );
    const [expandedReports, setExpandedReports] = useState<Set<string>>(
        new Set()
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"tables" | "reports">("tables");

    // Handle tab changes and trigger lazy loading
    const handleTabChange = async (tab: "tables" | "reports") => {
        setActiveTab(tab);
        onTabChange?.(tab);

        // Load data for the newly focused tab
        if (
            tab === "tables" &&
            (!isTablesLoaded || tables.length === 0) &&
            loadTables
        ) {
            await loadTables();
        } else if (
            tab === "reports" &&
            (!isReportsLoaded || reports.length === 0) &&
            loadReports
        ) {
            await loadReports();
        }
    };

    const toggleTable = (tableName: string) => {
        const newExpanded = new Set(expandedTables);
        if (newExpanded.has(tableName)) {
            newExpanded.delete(tableName);
        } else {
            newExpanded.add(tableName);
        }
        setExpandedTables(newExpanded);
    };

    const toggleReportGroup = (groupName: string) => {
        const newExpanded = new Set(expandedReports);
        if (newExpanded.has(groupName)) {
            newExpanded.delete(groupName);
        } else {
            newExpanded.add(groupName);
        }
        setExpandedReports(newExpanded);
    };

    // Enhanced search that filters tables, columns, reports, and SQL content
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

    const filteredReports = useMemo(() => {
        if (!searchQuery.trim()) {
            return reports;
        }

        const query = searchQuery.toLowerCase();

        return reports
            .filter((group) => {
                // Check if group name matches
                const groupMatches = group.name.toLowerCase().includes(query);

                // Check if any reports match
                const hasMatchingReports = group.reports.some(
                    (report) =>
                        report.name.toLowerCase().includes(query) ||
                        report.sql.toLowerCase().includes(query)
                );

                return groupMatches || hasMatchingReports;
            })
            .map((group) => {
                // If searching, filter reports to only show matching ones
                if (searchQuery.trim()) {
                    const filteredReports = group.reports.filter(
                        (report) =>
                            report.name.toLowerCase().includes(query) ||
                            report.sql.toLowerCase().includes(query)
                    );
                    return { ...group, reports: filteredReports };
                }
                return group;
            });
    }, [reports, searchQuery]);

    return (
        <div className="flex flex-col h-full bg-background border-r border-border">
            {/* Header */}
            <div className="p-3 border-b border-border">
                <div className="flex items-center gap-2 mb-3">
                    <Database className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">
                        Database Explorer
                    </span>
                </div>

                {/* Search */}
                <SearchBox
                    placeholder={`Search ${
                        activeTab === "tables"
                            ? "tables and columns"
                            : "reports and SQL"
                    }...`}
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
                <div className="border-b border-border">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onRefresh}
                        className="w-full justify-center p-6 h-8 hover:bg-accent"
                        disabled={isLoading}
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Custom Tabs */}
            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex w-full">
                    <button
                        onClick={() => handleTabChange("tables")}
                        className={`flex-1 flex items-center justify-center text-xs font-medium transition-all duration-200 relative border-b-2 min-h-[44px] ${
                            activeTab === "tables"
                                ? "text-foreground border-primary bg-accent/20"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50 border-transparent"
                        }`}
                    >
                        <Table className="h-3 w-3 mr-2" />
                        Tables
                    </button>
                    <button
                        onClick={() => handleTabChange("reports")}
                        className={`flex-1 flex items-center justify-center text-xs font-medium transition-all duration-200 relative border-b-2 min-h-[44px] ${
                            activeTab === "reports"
                                ? "text-foreground border-primary bg-accent/20"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50 border-transparent"
                        }`}
                    >
                        <FileText className="h-3 w-3 mr-2" />
                        Reports
                    </button>
                </div>

                {/* Tables Content */}
                {activeTab === "tables" && (
                    <div className="flex-1 overflow-y-auto p-2 scrollbar-thin min-h-0">
                        {isLoadingTables ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-sm text-muted-foreground">
                                    Loading tables...
                                </span>
                            </div>
                        ) : filteredTables.length === 0 && searchQuery ? (
                            <div className="text-center py-8 text-sm text-muted-foreground">
                                No tables found matching "{searchQuery}"
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
                                        <span className="truncate">
                                            {table.name}
                                        </span>
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
                                                        {column.name}{" "}
                                                        {column.data_type}
                                                    </span>
                                                </Button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Reports Content */}
                {activeTab === "reports" && (
                    <div className="flex-1 overflow-y-auto p-2 scrollbar-thin min-h-0">
                        {isLoadingReports ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-sm text-muted-foreground">
                                    Loading reports...
                                </span>
                            </div>
                        ) : filteredReports.length === 0 && searchQuery ? (
                            <div className="text-center py-8 text-sm text-muted-foreground">
                                No reports found matching "{searchQuery}"
                            </div>
                        ) : (
                            filteredReports.map((group) => (
                                <div key={group.name} className="mb-1">
                                    {/* Group Header */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            toggleReportGroup(group.name)
                                        }
                                        className="w-full justify-start p-1 h-auto hover:bg-accent text-xs font-normal"
                                    >
                                        {expandedReports.has(group.name) ? (
                                            <ChevronDown className="h-3 w-3 mr-1" />
                                        ) : (
                                            <ChevronRight className="h-3 w-3 mr-1" />
                                        )}
                                        <span className="truncate">
                                            {group.name}
                                        </span>
                                    </Button>

                                    {/* Reports */}
                                    {expandedReports.has(group.name) && (
                                        <div className="ml-6 mt-1">
                                            {group.reports.map((report) => {
                                                // Check if this report matches the search
                                                const isNameMatch = searchQuery
                                                    ? report.name
                                                          .toLowerCase()
                                                          .includes(
                                                              searchQuery.toLowerCase()
                                                          )
                                                    : false;
                                                const isSqlMatch = searchQuery
                                                    ? report.sql
                                                          .toLowerCase()
                                                          .includes(
                                                              searchQuery.toLowerCase()
                                                          )
                                                    : false;

                                                return (
                                                    <Button
                                                        key={report.id}
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            onReportSelect?.(
                                                                report.id
                                                            )
                                                        }
                                                        className="w-full justify-start p-1 h-auto hover:bg-accent text-xs font-normal text-muted-foreground"
                                                    >
                                                        <span className="truncate">
                                                            {report.name}
                                                        </span>
                                                        {isSqlMatch && (
                                                            <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded">
                                                                Found SQL
                                                            </span>
                                                        )}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

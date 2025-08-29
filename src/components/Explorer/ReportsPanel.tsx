import React, { useMemo } from "react";
import { ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExplorerStore } from "@/stores/explorerStore";
import { useEditorStore } from "@/components/Editor/store/editorStore";

interface ReportsPanelProps {
    onReportSelect?: (reportId: string) => void;
}

export function ReportsPanel({ onReportSelect }: ReportsPanelProps) {
    const {
        reports,
        isLoadingReports,
        searchQuery,
        expandedReports,
        toggleReportGroupExpansion,
    } = useExplorerStore();

    const { createReportTab } = useEditorStore();

    // Enhanced search that filters reports and SQL content
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

    const handleReportSelect = (reportId: string) => {
        // Find the report by ID
        const report = reports
            .flatMap((group) => group.reports)
            .find((r) => r.id === reportId);

        if (report) {
            // Create a new tab with the report
            createReportTab({
                id: report.id,
                name: report.name,
                sql: report.sql,
            });
        }

        // Also call the optional callback if provided
        onReportSelect?.(reportId);
    };

    if (isLoadingReports) {
        return (
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin min-h-0">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">
                        Loading reports...
                    </span>
                </div>
            </div>
        );
    }

    if (filteredReports.length === 0 && searchQuery) {
        return (
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin min-h-0">
                <div className="text-center py-8 text-sm text-muted-foreground">
                    No reports found matching "{searchQuery}"
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin min-h-0">
            {filteredReports.map((group) => (
                <div key={group.name} className="mb-1">
                    {/* Group Header */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleReportGroupExpansion(group.name)}
                        className="w-full justify-start p-1 h-auto hover:bg-accent text-xs font-normal"
                    >
                        {expandedReports.has(group.name) ? (
                            <ChevronDown className="h-3 w-3 mr-1" />
                        ) : (
                            <ChevronRight className="h-3 w-3 mr-1" />
                        )}
                        <span className="truncate">{group.name}</span>
                    </Button>

                    {/* Reports */}
                    {expandedReports.has(group.name) && (
                        <div className="ml-6 mt-1">
                            {group.reports.map((report) => {
                                // Check if this report matches the search
                                const isNameMatch = searchQuery
                                    ? report.name
                                          .toLowerCase()
                                          .includes(searchQuery.toLowerCase())
                                    : false;
                                const isSqlMatch = searchQuery
                                    ? report.sql
                                          .toLowerCase()
                                          .includes(searchQuery.toLowerCase())
                                    : false;

                                return (
                                    <Button
                                        key={report.id}
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            handleReportSelect(report.id)
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
            ))}
        </div>
    );
}

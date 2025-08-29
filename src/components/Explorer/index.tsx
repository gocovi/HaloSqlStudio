import React, { useEffect, useCallback } from "react";
import { useExplorerStore } from "@/stores/explorerStore";
import { useApi } from "@/hooks/useApi";
import { ExplorerHeader } from "./ExplorerHeader";
import { ExplorerTabs } from "./ExplorerTabs";
import { TablesPanel } from "./TablesPanel";
import { ReportsPanel } from "./ReportsPanel";

interface ExplorerProps {
    onTableSelect?: (tableName: string) => void;
    onColumnSelect?: (tableName: string, columnName: string) => void;
    onReportSelect?: (reportId: string) => void;
}

export function Explorer({
    onTableSelect,
    onColumnSelect,
    onReportSelect,
}: ExplorerProps) {
    const {
        activeTab,
        isTablesLoaded,
        isReportsLoaded,
        refreshTrigger,
        setTables,
        setReports,
        setLoadingTables,
        setLoadingReports,
        setTablesLoaded,
        setReportsLoaded,
    } = useExplorerStore();

    const { getTables, getReports } = useApi();

    const loadTables = useCallback(async () => {
        setLoadingTables(true);
        try {
            const tables = await getTables();
            setTables(tables);
            setTablesLoaded(true);
        } catch (error) {
            console.error("Failed to load tables:", error);
        } finally {
            setLoadingTables(false);
        }
    }, [getTables, setTables, setTablesLoaded, setLoadingTables]);

    const loadReports = useCallback(async () => {
        setLoadingReports(true);
        try {
            const reports = await getReports();
            setReports(reports);
            setReportsLoaded(true);
        } catch (error) {
            console.error("Failed to load reports:", error);
        } finally {
            setLoadingReports(false);
        }
    }, [getReports, setReports, setReportsLoaded, setLoadingReports]);

    // Load data when tab changes
    const handleTabChange = useCallback(
        async (tab: "tables" | "reports") => {
            if (
                tab === "tables" &&
                (!isTablesLoaded ||
                    useExplorerStore.getState().tables.length === 0)
            ) {
                await loadTables();
            } else if (
                tab === "reports" &&
                (!isReportsLoaded ||
                    useExplorerStore.getState().reports.length === 0)
            ) {
                await loadReports();
            }
        },
        [isTablesLoaded, isReportsLoaded, loadTables, loadReports]
    );

    // Initial load
    useEffect(() => {
        if (activeTab === "tables" && !isTablesLoaded) {
            loadTables();
        }
    }, [activeTab, isTablesLoaded, loadTables]);

    // Auto-reload when refresh trigger changes (for refresh mechanism)
    useEffect(() => {
        const state = useExplorerStore.getState();
        if (!state.isReportsLoaded && !state.isLoadingReports) {
            loadReports();
        }
    }, [refreshTrigger, loadReports]);

    return (
        <div className="flex flex-col h-full bg-background border-r border-border">
            <ExplorerHeader />
            <ExplorerTabs onTabChange={handleTabChange} />

            {activeTab === "tables" && (
                <TablesPanel
                    onTableSelect={onTableSelect}
                    onColumnSelect={onColumnSelect}
                />
            )}

            {activeTab === "reports" && (
                <ReportsPanel onReportSelect={onReportSelect} />
            )}
        </div>
    );
}

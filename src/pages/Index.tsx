import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TableExplorer } from "@/components/TableExplorer";
import { QueryTabs } from "@/components/QueryTabs";
import { QueryTab } from "@/components/QueryTab";
import { useAuth } from "@/contexts/AuthContext";
import { haloApiService, QueryResult, TableInfo } from "@/lib/halo-api";
import { Button } from "@/components/ui/button";
import { ConfigDialog } from "@/components/ConfigDialog";
import { LogOut, RefreshCw } from "lucide-react";
import {
    useTabPersistence,
    type PersistedTab,
} from "@/hooks/useTabPersistence";

// Remove mock data - will be replaced with real API calls

// Real query execution using Halo API
const executeQuery = async (sql: string): Promise<QueryResult> => {
    try {
        return await haloApiService.executeQuery(sql);
    } catch (error) {
        console.error("Query execution error:", error);
        throw error;
    }
};

const Index = () => {
    const { isAuthenticated, logout, config } = useAuth();
    const navigate = useNavigate();
    const [tables, setTables] = useState<TableInfo[]>([]);
    const [isLoadingTables, setIsLoadingTables] = useState(false);

    // Use the tab persistence hook
    const {
        tabs: persistedTabs,
        activeTabId,
        isLoaded: tabsLoaded,
        editingTabId,
        addTab,
        updateTabContent,
        updateTabTitle,
        startEditingTab,
        closeTab,
        setActiveTab,
        clearNonPinnedTabs,
    } = useTabPersistence();

    // Convert PersistedTab to Tab with React components
    const tabs = persistedTabs.map((persistedTab) => ({
        id: persistedTab.id,
        title: persistedTab.title,
        isPinned: persistedTab.isPinned,
        content: (
            <QueryTab
                key={persistedTab.id}
                onExecute={executeQuery}
                sqlContent={persistedTab.sql}
                onContentChange={(sql) =>
                    updateTabContent(persistedTab.id, sql)
                }
            />
        ),
    }));

    const loadTables = useCallback(async () => {
        if (!isAuthenticated) return;

        setIsLoadingTables(true);
        try {
            const fetchedTables = await haloApiService.getTables();
            setTables(fetchedTables);
        } catch (error) {
            console.error("Error loading tables:", error);
            // Fallback to empty tables
            setTables([]);
        } finally {
            setIsLoadingTables(false);
        }
    }, [isAuthenticated]);

    // Check authentication on mount
    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }

        // Load tables when authenticated
        loadTables();
    }, [isAuthenticated, navigate, loadTables]);

    const handleNewTab = useCallback(async () => {
        const newTabId = await addTab(`Query ${persistedTabs.length + 1}`);
        setActiveTab(newTabId);
    }, [persistedTabs.length, addTab, setActiveTab]);

    const handleTabClose = useCallback(
        async (tabId: string) => {
            await closeTab(tabId);
        },
        [closeTab]
    );

    const handleTableSelect = useCallback((tableName: string) => {
        console.log("Table selected:", tableName);
    }, []);

    const handleColumnSelect = useCallback(
        (tableName: string, columnName: string) => {
            console.log("Column selected:", tableName, columnName);
        },
        []
    );

    const handleTabTitleEdit = useCallback(
        async (tabId: string, newTitle: string) => {
            await updateTabTitle(tabId, newTitle);
        },
        [updateTabTitle]
    );

    // Authentication is now handled by ProtectedRoute component

    // Show loading state while IndexedDB is initializing
    if (!tabsLoaded) {
        return (
            <div className="h-screen flex items-center justify-center bg-background text-foreground">
                <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span>Loading tabs...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex bg-background text-foreground">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 h-12 bg-background border-b flex items-center justify-between px-4 z-10">
                <div className="flex items-center gap-2">
                    <h1 className="text-lg font-semibold">Halo SQL Explorer</h1>
                    <span className="text-sm text-muted-foreground">
                        •{" "}
                        {config.resourceServer
                            .replace("https://", "")
                            .replace("http://", "")}
                    </span>
                </div>
                <div className="flex items-center gap-0">
                    <ConfigDialog />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={logout}
                        className="rounded-none h-12 px-3"
                    >
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Sidebar */}
            <div className="w-80 flex-shrink-0 mt-12">
                <TableExplorer
                    tables={tables}
                    onTableSelect={handleTableSelect}
                    onColumnSelect={handleColumnSelect}
                    onRefresh={loadTables}
                    isLoading={isLoadingTables}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 mt-12">
                <QueryTabs
                    tabs={tabs}
                    activeTabId={activeTabId}
                    editingTabId={editingTabId}
                    onTabChange={setActiveTab}
                    onTabClose={handleTabClose}
                    onCloseAllTabs={clearNonPinnedTabs}
                    onNewTab={handleNewTab}
                    onTabTitleEdit={handleTabTitleEdit}
                    onStartEditing={startEditingTab}
                />
            </div>
        </div>
    );
};

export default Index;

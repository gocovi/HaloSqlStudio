import { create } from "zustand";
import { persist } from "zustand/middleware";
import { replaceHaloVariables } from "@/lib/variable-replacer";

export interface Tab {
    id: string;
    title: string;
    sql: string;
    isPinned: boolean;
    isReport: boolean;
    reportId?: string;
    originalSql?: string;
    hasUnsavedChanges: boolean;
    lastModified: number;
    // Query execution state
    queryResult?: QueryResult | null;
    isExecuting?: boolean;
    queryError?: string | null;
    // Search state
    globalFilter?: string;
}

// Import the QueryResult type
import type { QueryResult } from "@/services/api/types";

interface EditorState {
    // State
    tabs: Tab[];
    activeTabId: string;
    editingTabId: string | null;
    variables: Record<string, string>;

    // Actions
    addTab: (title: string, sql?: string, metadata?: Partial<Tab>) => void;
    updateTab: (id: string, updates: Partial<Tab>) => void;
    closeTab: (id: string) => void;
    setActiveTab: (id: string) => void;
    startEditingTab: (id: string) => void;
    stopEditingTab: () => void;

    // Report-specific actions
    createReportTab: (report: {
        id: string;
        name: string;
        sql: string;
    }) => void;
    saveReport: (
        tabId: string,
        updateReportFn: (reportId: string, sql: string) => Promise<void>
    ) => Promise<void>;
    updateTabContent: (tabId: string, sql: string) => void;

    // Query execution actions
    executeQuery: (
        tabId: string,
        executeQueryFn: (sql: string) => Promise<QueryResult>
    ) => Promise<void>;
    clearQueryResult: (tabId: string) => void;

    // Search actions
    setGlobalFilter: (tabId: string, filter: string) => void;
    clearGlobalFilter: (tabId: string) => void;

    // Variables actions
    setVariables: (variables: Record<string, string>) => void;

    // Utility
    getActiveTab: () => Tab | undefined;
    getTabById: (id: string) => Tab | undefined;
}

export const useEditorStore = create<EditorState>()(
    persist(
        (set, get) => ({
            // Initial state
            tabs: [
                {
                    id: "console",
                    title: "Console",
                    sql: "",
                    isPinned: true,
                    isReport: false,
                    hasUnsavedChanges: false,
                    lastModified: Date.now(),
                },
            ],
            activeTabId: "console",
            editingTabId: null,
            variables: {
                $agentid: "",
                $siteid: "",
                $clientid: "",
            },

            // Actions
            addTab: (title, sql = "", metadata = {}) => {
                const newTab: Tab = {
                    id: `query-${Date.now()}`,
                    title,
                    sql,
                    isPinned: false,
                    isReport: false,
                    hasUnsavedChanges: false,
                    lastModified: Date.now(),
                    ...metadata,
                };

                set((state) => ({
                    tabs: [...state.tabs, newTab],
                    activeTabId: newTab.id,
                }));
            },

            updateTab: (id, updates) => {
                set((state) => ({
                    tabs: state.tabs.map((tab) =>
                        tab.id === id
                            ? { ...tab, ...updates, lastModified: Date.now() }
                            : tab
                    ),
                }));
            },

            closeTab: (id) => {
                const state = get();
                if (id === "console") return; // Don't close console tab

                const newTabs = state.tabs.filter((tab) => tab.id !== id);
                let newActiveTabId = state.activeTabId;

                // If we're closing the active tab, switch to another tab
                if (state.activeTabId === id) {
                    const remainingTabs = newTabs.filter(
                        (tab) => !tab.isPinned
                    );
                    if (remainingTabs.length > 0) {
                        newActiveTabId =
                            remainingTabs[remainingTabs.length - 1].id;
                    } else {
                        newActiveTabId = "console";
                    }
                }

                set({
                    tabs: newTabs,
                    activeTabId: newActiveTabId,
                });
            },

            setActiveTab: (id) => {
                set({ activeTabId: id });
            },

            startEditingTab: (id) => {
                set({ editingTabId: id });
            },

            stopEditingTab: () => {
                set({ editingTabId: null });
            },

            // Report-specific actions
            createReportTab: (report) => {
                const newTab: Tab = {
                    id: `query-${Date.now()}`,
                    title: `Report: ${report.name}`,
                    sql: report.sql,
                    isPinned: false,
                    isReport: true,
                    reportId: report.id,
                    originalSql: report.sql,
                    hasUnsavedChanges: false,
                    lastModified: Date.now(),
                };

                set((state) => ({
                    tabs: [...state.tabs, newTab],
                    activeTabId: newTab.id,
                }));
            },

            saveReport: async (tabId, updateReportFn) => {
                const tab = get().getTabById(tabId);
                if (tab?.isReport && tab.reportId) {
                    try {
                        // Call the actual API
                        await updateReportFn(tab.reportId, tab.sql);

                        // Update the tab to clear unsaved changes
                        get().updateTab(tabId, {
                            hasUnsavedChanges: false,
                            originalSql: tab.sql,
                        });
                    } catch (error) {
                        console.error("Failed to save report:", error);
                        throw error; // Re-throw so the UI can handle it
                    }
                }
            },

            updateTabContent: (tabId, sql) => {
                const state = get();
                const tab = state.getTabById(tabId);
                if (!tab) return;

                const hasUnsavedChanges = tab.isReport
                    ? sql !== tab.originalSql
                    : false;

                state.updateTab(tabId, {
                    sql,
                    hasUnsavedChanges,
                });
            },

            // Query execution actions
            executeQuery: async (tabId, executeQueryFn) => {
                const tab = get().getTabById(tabId);
                if (!tab) return;

                set((state) => ({
                    tabs: state.tabs.map((t) =>
                        t.id === tabId
                            ? {
                                  ...t,
                                  isExecuting: true,
                                  queryResult: null,
                                  queryError: null,
                              }
                            : t
                    ),
                }));

                try {
                    // Replace Halo variables in SQL before execution
                    const state = get();
                    const processedSql = replaceHaloVariables(tab.sql, state.variables);

                    const result = await executeQueryFn(processedSql);
                    set((state) => ({
                        tabs: state.tabs.map((t) =>
                            t.id === tabId
                                ? {
                                      ...t,
                                      queryResult: result,
                                      isExecuting: false,
                                  }
                                : t
                        ),
                    }));
                } catch (error) {
                    set((state) => ({
                        tabs: state.tabs.map((t) =>
                            t.id === tabId
                                ? {
                                      ...t,
                                      queryError: error.message,
                                      isExecuting: false,
                                  }
                                : t
                        ),
                    }));
                }
            },

            clearQueryResult: (tabId) => {
                set((state) => ({
                    tabs: state.tabs.map((t) =>
                        t.id === tabId
                            ? { ...t, queryResult: null, queryError: null }
                            : t
                    ),
                }));
            },

            // Search actions
            setGlobalFilter: (tabId, filter) => {
                set((state) => ({
                    tabs: state.tabs.map((t) =>
                        t.id === tabId ? { ...t, globalFilter: filter } : t
                    ),
                }));
            },

            clearGlobalFilter: (tabId) => {
                set((state) => ({
                    tabs: state.tabs.map((t) =>
                        t.id === tabId ? { ...t, globalFilter: "" } : t
                    ),
                }));
            },

            // Variables actions
            setVariables: (variables) => {
                set({ variables });
            },

            // Utility
            getActiveTab: () => {
                const state = get();
                return state.tabs.find((tab) => tab.id === state.activeTabId);
            },

            getTabById: (id) => {
                const state = get();
                return state.tabs.find((tab) => tab.id === id);
            },
        }),
        {
            name: "editor-storage",
            partialize: (state) => ({
                tabs: state.tabs.map((tab) => ({
                    ...tab,
                    queryResult: undefined, // Don't persist query results
                    isExecuting: false, // Don't persist execution state
                    queryError: null, // Don't persist errors
                })),
                activeTabId: state.activeTabId,
            }),
        }
    )
);

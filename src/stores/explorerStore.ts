import { create } from "zustand";
import type { TableInfo, ReportInfo } from "@/services/api/types";

interface ExplorerState {
    // Data
    tables: TableInfo[];
    reports: ReportInfo[];

    // Loading states
    isLoadingTables: boolean;
    isLoadingReports: boolean;
    isTablesLoaded: boolean;
    isReportsLoaded: boolean;

    // UI state
    activeTab: "tables" | "reports";
    expandedTables: Set<string>;
    expandedReports: Set<string>;
    searchQuery: string;

    // Refresh trigger
    refreshTrigger: number;

    // Actions
    setTables: (tables: TableInfo[]) => void;
    setReports: (reports: ReportInfo[]) => void;
    setLoadingTables: (loading: boolean) => void;
    setLoadingReports: (loading: boolean) => void;
    setTablesLoaded: (loaded: boolean) => void;
    setReportsLoaded: (loaded: boolean) => void;
    setActiveTab: (tab: "tables" | "reports") => void;
    toggleTableExpansion: (tableName: string) => void;
    toggleReportGroupExpansion: (groupName: string) => void;
    setSearchQuery: (query: string) => void;
    refreshReports: () => void;
    refreshTables: () => void;
}

export const useExplorerStore = create<ExplorerState>((set, get) => ({
    // Initial state
    tables: [],
    reports: [],
    isLoadingTables: false,
    isLoadingReports: false,
    isTablesLoaded: false,
    isReportsLoaded: false,
    activeTab: "tables",
    expandedTables: new Set(),
    expandedReports: new Set(),
    searchQuery: "",
    refreshTrigger: 0,

    // Actions
    setTables: (tables) => set({ tables }),
    setReports: (reports) => set({ reports }),
    setLoadingTables: (loading) => set({ isLoadingTables: loading }),
    setLoadingReports: (loading) => set({ isLoadingReports: loading }),
    setTablesLoaded: (loaded) => set({ isTablesLoaded: loaded }),
    setReportsLoaded: (loaded) => set({ isReportsLoaded: loaded }),
    setActiveTab: (activeTab) => set({ activeTab }),

    toggleTableExpansion: (tableName) => {
        const { expandedTables } = get();
        const newExpanded = new Set(expandedTables);
        if (newExpanded.has(tableName)) {
            newExpanded.delete(tableName);
        } else {
            newExpanded.add(tableName);
        }
        set({ expandedTables: newExpanded });
    },

    toggleReportGroupExpansion: (groupName) => {
        const { expandedReports } = get();
        const newExpanded = new Set(expandedReports);
        if (newExpanded.has(groupName)) {
            newExpanded.delete(groupName);
        } else {
            newExpanded.add(groupName);
        }
        set({ expandedReports: newExpanded });
    },

    setSearchQuery: (searchQuery) => set({ searchQuery }),

    refreshReports: () => {
        // Increment refresh trigger and clear loaded state
        set((state) => ({
            refreshTrigger: state.refreshTrigger + 1,
            isReportsLoaded: false,
        }));
    },

    refreshTables: () => {
        // Increment refresh trigger and clear loaded state
        set((state) => ({
            refreshTrigger: state.refreshTrigger + 1,
            isTablesLoaded: false,
        }));
    },
}));

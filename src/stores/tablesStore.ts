import { create } from "zustand";
import type { TableInfo } from "@/services/api/types";
import type { ApiClient } from "@/services/api/client";
import { getTables } from "@/services/api/queries";

interface TablesState {
    tables: TableInfo[];
    isLoading: boolean;
    error: string | null;
}

interface TablesActions {
    refreshTables: (apiClient: ApiClient) => Promise<void>;
    setTables: (tables: TableInfo[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
}

type TablesStore = TablesState & TablesActions;

export const useTablesStore = create<TablesStore>((set, get) => ({
    // Initial state
    tables: [],
    isLoading: false,
    error: null,

    // Actions
    refreshTables: async (apiClient: ApiClient) => {
        const { setLoading, setError, setTables } = get();

        setLoading(true);
        setError(null);

        try {
            const fetchedTables = await getTables(apiClient);
            setTables(fetchedTables);

            // Expose tables globally for Monaco completion provider
            if (typeof window !== "undefined") {
                window.__HALO_TABLES__ = fetchedTables;
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to load tables";
            setError(errorMessage);
            setTables([]);
        } finally {
            setLoading(false);
        }
    },

    setTables: (tables) => set({ tables }),

    setLoading: (isLoading) => set({ isLoading }),

    setError: (error) => set({ error }),

    clearError: () => set({ error: null }),
}));

// Selector hooks for better performance
export const useTables = () => useTablesStore((state) => state.tables);
export const useTablesLoading = () =>
    useTablesStore((state) => state.isLoading);
export const useTablesError = () => useTablesStore((state) => state.error);

// Use selector for actions to prevent infinite loops
export const useTablesActions = () =>
    useTablesStore((state) => ({
        refreshTables: state.refreshTables,
        setTables: state.setTables,
        setLoading: state.setLoading,
        setError: state.setError,
        clearError: state.clearError,
    }));

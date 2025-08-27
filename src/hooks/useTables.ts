import { useEffect, useCallback, useRef } from "react";
import { apiService } from "@/services/api/apiService";
import {
    useTables as useTablesData,
    useTablesLoading,
    useTablesStore,
} from "@/stores/tablesStore";

/**
 * Custom hook that provides the same interface as the old TablesContext
 * but uses Zustand under the hood for better performance
 */
export function useTables() {
    const tables = useTablesData();
    const storeLoading = useTablesLoading();
    const hasLoadedRef = useRef(false);

    // Memoize the refreshTables function to prevent infinite loops
    const refreshTables = useCallback(async () => {
        try {
            const fetchedTables = await apiService.getTables();
            useTablesStore.getState().setTables(fetchedTables);
        } catch (error) {
            console.error("Failed to refresh tables:", error);
        }
    }, []);

    // Only load tables once when component first mounts and API is configured
    useEffect(() => {
        if (
            !hasLoadedRef.current &&
            tables.length === 0 &&
            apiService.isConfigured()
        ) {
            hasLoadedRef.current = true;
            refreshTables();
        }
    }, [refreshTables, tables]);

    return {
        tables,
        isLoading: storeLoading,
        error: null,
        refreshTables,
    };
}

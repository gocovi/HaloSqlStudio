import { useState, useEffect, useCallback } from "react";
import { useApi } from "./useApi";
import { useConfig } from "./useConfig";
import type { TableInfo, ReportInfo } from "@/services/api/types";

export function useTables() {
    const [tables, setTables] = useState<TableInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const { getTables: fetchTables } = useApi();
    const { isLoaded: configLoaded } = useConfig();

    const refreshTables = useCallback(async () => {
        if (!configLoaded) return; // Don't fetch until config is loaded

        setIsLoading(true);
        try {
            const fetchedTables = await fetchTables();
            setTables(fetchedTables);
            setIsLoaded(true);
        } catch (error) {
            console.error("Failed to fetch tables:", error);
        } finally {
            setIsLoading(false);
        }
    }, [fetchTables, configLoaded]);

    const loadTables = useCallback(async () => {
        if (!isLoaded && !isLoading) {
            await refreshTables();
        }
    }, [isLoaded, isLoading, refreshTables]);

    // Only auto-load tables if they haven't been loaded yet and config is ready
    useEffect(() => {
        if (configLoaded && !isLoaded && !isLoading) {
            loadTables();
        }
    }, [configLoaded, isLoaded, isLoading, loadTables]);

    return { tables, isLoading, isLoaded, refreshTables, loadTables };
}

export function useReports() {
    const [reports, setReports] = useState<ReportInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const { getReports: fetchReports } = useApi();
    const { isLoaded: configLoaded } = useConfig();

    const refreshReports = useCallback(async () => {
        if (!configLoaded) return; // Don't fetch until config is loaded

        setIsLoading(true);
        try {
            const fetchedReports = await fetchReports();
            setReports(fetchedReports);
            setIsLoaded(true);
        } catch (error) {
            console.error("Failed to fetch reports:", error);
        } finally {
            setIsLoading(false);
        }
    }, [fetchReports, configLoaded]);

    const loadReports = useCallback(async () => {
        if (!isLoaded && !isLoading) {
            await refreshReports();
        }
    }, [isLoaded, isLoading, refreshReports]);

    // Don't auto-load reports - only load when explicitly requested
    // useEffect(() => {
    //     if (configLoaded && !isLoaded && !isLoading) {
    //         loadReports();
    //     }
    // }, [configLoaded, isLoaded, isLoading, loadReports]);

    return { reports, isLoading, isLoaded, refreshReports, loadReports };
}

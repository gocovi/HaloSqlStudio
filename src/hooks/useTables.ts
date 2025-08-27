import { useState, useEffect, useCallback } from "react";
import { useApi } from "./useApi";
import { useConfig } from "./useConfig";
import type { TableInfo, ReportInfo } from "@/services/api/types";

export function useTables() {
    const [tables, setTables] = useState<TableInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { getTables: fetchTables } = useApi();
    const { isLoaded: configLoaded } = useConfig();

    const refreshTables = useCallback(async () => {
        if (!configLoaded) return; // Don't fetch until config is loaded

        setIsLoading(true);
        try {
            const fetchedTables = await fetchTables();
            setTables(fetchedTables);
        } catch (error) {
            console.error("Failed to fetch tables:", error);
        } finally {
            setIsLoading(false);
        }
    }, [fetchTables, configLoaded]);

    useEffect(() => {
        if (configLoaded) {
            refreshTables();
        }
    }, [refreshTables, configLoaded]);

    return { tables, isLoading, refreshTables };
}

export function useReports() {
    const [reports, setReports] = useState<ReportInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { getReports: fetchReports } = useApi();
    const { isLoaded: configLoaded } = useConfig();

    const refreshReports = useCallback(async () => {
        if (!configLoaded) return; // Don't fetch until config is loaded

        setIsLoading(true);
        try {
            const fetchedReports = await fetchReports();
            setReports(fetchedReports);
        } catch (error) {
            console.error("Failed to fetch reports:", error);
        } finally {
            setIsLoading(false);
        }
    }, [fetchReports, configLoaded]);

    useEffect(() => {
        if (configLoaded) {
            refreshReports();
        }
    }, [refreshReports, configLoaded]);

    return { reports, isLoading, refreshReports };
}

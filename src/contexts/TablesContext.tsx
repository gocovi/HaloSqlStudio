import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
} from "react";
import { useAuth } from "./AuthContext";
import { haloApiService, TableInfo } from "@/lib/halo-api";

interface TablesContextType {
    tables: TableInfo[];
    isLoading: boolean;
    refreshTables: () => Promise<void>;
}

const TablesContext = createContext<TablesContextType | undefined>(undefined);

export function TablesProvider({ children }: { children: React.ReactNode }) {
    const [tables, setTables] = useState<TableInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { isAuthenticated } = useAuth();

    const loadTables = useCallback(async () => {
        if (!isAuthenticated) return;

        setIsLoading(true);
        try {
            const fetchedTables = await haloApiService.getTables();
            setTables(fetchedTables);
        } catch (error) {
            console.error("Error loading tables:", error);
            setTables([]);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    const refreshTables = useCallback(async () => {
        await loadTables();
    }, [loadTables]);

    useEffect(() => {
        if (isAuthenticated) {
            loadTables();
        }
    }, [isAuthenticated, loadTables]);

    // Expose tables globally for Monaco completion provider
    useEffect(() => {
        if (typeof window !== "undefined") {
            window.__HALO_TABLES__ = tables;
        }
    }, [tables]);

    return (
        <TablesContext.Provider value={{ tables, isLoading, refreshTables }}>
            {children}
        </TablesContext.Provider>
    );
}

export function useTables() {
    const context = useContext(TablesContext);
    if (context === undefined) {
        throw new Error("useTables must be used within a TablesProvider");
    }
    return context;
}

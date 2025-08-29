import {
    useState,
    useCallback,
    useEffect,
    useRef,
    useMemo,
    lazy,
    Suspense,
} from "react";
import { useNavigate } from "react-router-dom";
import { Explorer } from "@/components/Explorer";
import { useAuth } from "@/contexts/AuthContext";
import { useConfig } from "@/hooks/useConfig";
import { useTables } from "@/hooks/useTables";
import { useReports } from "@/hooks/useTables";
import { useApi } from "@/hooks/useApi";
import type { QueryResult } from "@/services/api/types";
import { Button } from "@/components/ui/button";
import { ConfigDialog } from "@/components/ConfigDialog";
import { LogOut, RefreshCw, GripVertical } from "lucide-react";
import {
    useTabPersistence,
    type PersistedTab,
} from "@/hooks/useTabPersistence";
import { useEditorStore } from "@/components/Editor/store/editorStore";

// Lazy load the Editor component to reduce initial bundle size
const Editor = lazy(() =>
    import("@/components/Editor").then((module) => ({ default: module.Editor }))
);

const Index = () => {
    const { isAuthenticated, logout } = useAuth();
    const { config } = useConfig();
    const {
        tables,
        isLoading: isLoadingTables,
        isLoaded: isTablesLoaded,
        refreshTables,
        loadTables,
    } = useTables();
    const {
        reports,
        isLoading: isLoadingReports,
        isLoaded: isReportsLoaded,
        refreshReports,
        loadReports,
    } = useReports();
    const { executeQuery, updateReport } = useApi();
    const navigate = useNavigate();

    // Use the editor store
    const { createReportTab } = useEditorStore();

    const [explorerWidth, setExplorerWidth] = useState(() => {
        const saved = localStorage.getItem("explorerWidth");
        return saved ? parseInt(saved, 10) : 320;
    });
    const isResizingRef = useRef(false);
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            isResizingRef.current = true;
            startXRef.current = e.clientX;
            startWidthRef.current = explorerWidth;
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
        },
        [explorerWidth]
    );

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizingRef.current) return;

        const deltaX = e.clientX - startXRef.current;
        const newWidth = Math.max(
            200,
            Math.min(600, startWidthRef.current + deltaX)
        );
        setExplorerWidth(newWidth);
        localStorage.setItem("explorerWidth", newWidth.toString());
    }, []);

    const handleMouseUp = useCallback(() => {
        isResizingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
    }, []);

    useEffect(() => {
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    // The Editor component now handles all tab management internally

    // Check authentication on mount
    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }
    }, [isAuthenticated, navigate]);

    const handleNewTab = useCallback(() => {
        // This will be handled by the Editor component
        console.log("New tab requested");
    }, []);

    const handleTableSelect = useCallback((tableName: string) => {
        // console.log("Table selected:", tableName);
    }, []);

    const handleColumnSelect = useCallback(
        (tableName: string, columnName: string) => {
            // console.log("Column selected:", tableName, columnName);
        },
        []
    );

    const handleReportSelect = useCallback(
        (reportId: string) => {
            // Find the report by ID
            const report = reports
                .flatMap((group) => group.reports)
                .find((r) => r.id === reportId);
            if (report) {
                createReportTab({
                    id: report.id,
                    name: report.name,
                    sql: report.sql,
                });
            }
        },
        [reports, createReportTab]
    );

    const handleRefresh = useCallback(async () => {
        await Promise.all([refreshTables(), refreshReports()]);
    }, [refreshTables, refreshReports]);

    const handleTabChange = useCallback(
        (tab: "tables" | "reports") => {
            if (tab === "tables" && !isTablesLoaded) {
                loadTables();
            } else if (tab === "reports" && !isReportsLoaded) {
                loadReports();
            }
        },
        [isTablesLoaded, isReportsLoaded, loadTables, loadReports]
    );

    // Authentication is now handled by ProtectedRoute component

    return (
        <div className="h-screen flex bg-background text-foreground">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 h-12 bg-background border-b flex items-center justify-between px-4 z-10">
                <div className="flex items-center gap-2">
                    {/* Logo */}
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 500 500"
                        className="flex-shrink-0"
                    >
                        <g transform="matrix(1.54321,0,0,1.54321,-98.7654,-89.5062)">
                            <path
                                d="M226,58C315.41,58 388,130.59 388,220C388,309.41 315.41,382 226,382C136.59,382 64,309.41 64,220C64,130.59 136.59,58 226,58ZM147.357,273.917L132.282,319.144L176.723,304.33C191.044,313.721 207.928,319.144 226,319.144C277.724,319.144 319.718,274.719 319.718,220C319.718,165.281 277.724,120.856 226,120.856C174.276,120.856 132.282,165.281 132.282,220C132.282,239.876 137.822,258.393 147.357,273.917Z"
                                style={{ fill: "url(#_Linear1)" }}
                            />
                        </g>
                        <defs>
                            <linearGradient
                                id="_Linear1"
                                x1="0"
                                y1="0"
                                x2="1"
                                y2="0"
                                gradientUnits="userSpaceOnUse"
                                gradientTransform="matrix(213.84,-243.648,243.648,213.84,115.192,338.584)"
                            >
                                <stop
                                    offset="0"
                                    style={{
                                        stopColor: "rgb(0,52,121)",
                                        stopOpacity: 1,
                                    }}
                                />
                                <stop
                                    offset="1"
                                    style={{
                                        stopColor: "rgb(0,79,184)",
                                        stopOpacity: 1,
                                    }}
                                />
                            </linearGradient>
                        </defs>
                    </svg>

                    <h1 className="text-lg font-semibold">Halo SQL Studio</h1>
                    <span className="text-sm text-muted-foreground">
                        •{" "}
                        {config.resourceServer
                            .replace("https://", "")
                            .replace("http://", "")}
                    </span>
                </div>
                <div className="flex items-center gap-2">
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
            <div
                className="flex-shrink-0 mt-12 relative"
                style={{ width: `${explorerWidth}px` }}
            >
                <Explorer
                    tables={tables}
                    reports={reports}
                    onTableSelect={handleTableSelect}
                    onColumnSelect={handleColumnSelect}
                    onReportSelect={handleReportSelect}
                    onRefresh={handleRefresh}
                    isLoading={isLoadingTables || isLoadingReports}
                    loadTables={loadTables}
                    loadReports={loadReports}
                    isTablesLoaded={isTablesLoaded}
                    isReportsLoaded={isReportsLoaded}
                    onTabChange={handleTabChange}
                    isLoadingTables={isLoadingTables}
                    isLoadingReports={isLoadingReports}
                />
            </div>

            {/* Resizable Splitter */}
            <div
                className="w-px bg-border cursor-col-resize flex-shrink-0 mt-12 relative flex items-center justify-center"
                onMouseDown={handleMouseDown}
                title="Drag to resize Explorer"
            >
                {/* Always visible handle - matches ResizableHandle exactly */}
                <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
                    <GripVertical className="h-2.5 w-2.5 text-foreground" />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 mt-12">
                <Suspense
                    fallback={
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                                <p className="text-muted-foreground">
                                    Loading SQL Editor...
                                </p>
                            </div>
                        </div>
                    }
                >
                    <Editor />
                </Suspense>
            </div>
        </div>
    );
};

export default Index;

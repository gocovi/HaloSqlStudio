import React, { useMemo, useRef, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import {
    ColDef,
    GridOptions,
    ModuleRegistry,
    AllCommunityModule,
    GridApi,
} from "ag-grid-community";
import { themeQuartz } from "ag-grid-community";
import type { QueryResult } from "@/services/api/types";
import { useEditorStore } from "../store/editorStore";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// AG Grid theme configuration
const myTheme = themeQuartz.withParams({
    accentColor: "#3C83F6",
    backgroundColor: "#14161A",
    borderRadius: 0,
    browserColorScheme: "dark",
    chromeBackgroundColor: {
        ref: "foregroundColor",
        mix: 0.07,
        onto: "backgroundColor",
    },
    fontFamily: {
        googleFont: "IBM Plex Sans",
    },
    foregroundColor: "#FFF",
    headerBackgroundColor: "#191B1F",
    headerFontSize: 16,
    wrapperBorderRadius: 0,

    // Additional theme parameters for better appearance
    borderColor: "#2A2D31",
});

interface AgDataTableProps {
    result: QueryResult | null;
}

export const ResultsTable: React.FC<AgDataTableProps> = ({ result }) => {
    const gridRef = useRef<AgGridReact>(null);
    const { activeTabId } = useEditorStore();

    // Get the current tab's global filter from the store
    const currentTab = useEditorStore((state) =>
        state.tabs.find((tab) => tab.id === activeTabId)
    );
    const globalFilter = currentTab?.globalFilter || "";

    // Transform data for AG Grid
    const rowData = useMemo(() => {
        if (!result?.rows) return [];

        return result.rows.map((row, index) => ({
            id: index,
            ...row,
        }));
    }, [result]);

    // Generate column definitions dynamically
    const columnDefs = useMemo((): ColDef[] => {
        if (!result?.columns) return [];

        return result.columns.map((col) => ({
            field: col.name,
            headerName: col.name,
            sortable: true,
            filter: true,
            filterParams: {
                filterOptions: ["contains", "equals", "startsWith", "endsWith"],
                defaultOption: "contains",
            },
            resizable: true,
            minWidth: 120,
            maxWidth: 300,
            cellStyle: {
                fontSize: "14px",
                padding: "8px 12px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
            },
        }));
    }, [result]);

    // Grid options
    const gridOptions: GridOptions = {
        // Data
        rowData,
        columnDefs,

        // Styling
        rowHeight: 40,
        headerHeight: 44,

        // Features
        enableCellTextSelection: true,
        suppressCellFocus: true,

        // Global Search
        quickFilterText: globalFilter,

        // Pagination
        pagination: true,
        paginationPageSize: 50,
        paginationPageSizeSelector: [25, 50, 100, 200],

        // Performance
        rowBuffer: 20,
        suppressAnimationFrame: false,

        // Enable Google Fonts loading for the theme
        loadThemeGoogleFonts: true,

        // Default column properties
        defaultColDef: {
            sortable: true,
            filter: true,
            resizable: true,
            minWidth: 120,
            maxWidth: 300,
            cellStyle: {
                fontSize: "14px",
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
            },
        },
    };

    return (
        <div className="w-full h-full">
            <div
                className="h-full w-full"
                style={{
                    height: "100%",
                    minHeight: "400px",
                }}
            >
                <AgGridReact
                    ref={gridRef}
                    {...gridOptions}
                    // Apply theme directly to the component
                    theme={myTheme}
                    // Suppress warnings about invalid properties
                    onGridReady={(params) => {
                        // Suppress console warnings about invalid grid options
                        const originalWarn = console.warn;
                        console.warn = (...args) => {
                            if (
                                args[0] &&
                                typeof args[0] === "string" &&
                                args[0].includes(
                                    "AG Grid: invalid gridOptions property"
                                )
                            ) {
                                return; // Suppress AG Grid property warnings
                            }
                            originalWarn.apply(console, args);
                        };
                    }}
                />
            </div>
        </div>
    );
};

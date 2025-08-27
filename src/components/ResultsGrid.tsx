import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SearchBox } from "@/components/ui/search-box";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Copy, Check } from "lucide-react";
import type { QueryResult } from "@/lib/halo-api";
import {
    exportToJSON,
    exportToCSV,
    copyRowToClipboard,
} from "@/lib/export-utils";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";

interface ResultsGridProps {
    result: QueryResult | null;
    loading?: boolean;
    error?: string;
}

export function ResultsGrid({ result, loading, error }: ResultsGridProps) {
    const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>(
        {}
    );
    const [isResizing, setIsResizing] = useState(false);
    const [resizeStartX, setResizeStartX] = useState(0);
    const [resizeColumn, setResizeColumn] = useState<string | null>(null);
    const [copiedRowIndex, setCopiedRowIndex] = useState<number | null>(null);
    const [copiedCell, setCopiedCell] = useState<{
        rowIndex: number;
        colIndex: number;
    } | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<
        Array<{ rowIndex: number; colIndex: number; value: string }>
    >([]);
    const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
    const [isSearching, setIsSearching] = useState(false);
    const [currentView, setCurrentView] = useState<"table" | "json">("table");
    const [sortConfig, setSortConfig] = useState<{
        key: string;
        direction: "asc" | "desc";
    } | null>(null);
    const tableRef = useRef<HTMLDivElement>(null);

    // Sort rows based on current sort configuration
    const sortedRows = useMemo(() => {
        if (!result?.rows || !sortConfig) return result?.rows || [];

        console.log(
            "Sorting rows by:",
            sortConfig.key,
            "direction:",
            sortConfig.direction
        );
        console.log(
            "Sample values:",
            result.rows.slice(0, 3).map((row) => row[sortConfig.key])
        );

        const sorted = [...result.rows].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            // Handle null/undefined values
            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;

            // Convert to strings for comparison
            const aStr = String(aValue).toLowerCase();
            const bStr = String(bValue).toLowerCase();

            if (sortConfig.direction === "asc") {
                return aStr.localeCompare(bStr);
            } else {
                return bStr.localeCompare(aStr);
            }
        });

        console.log(
            "Sorted sample values:",
            sorted.slice(0, 3).map((row) => row[sortConfig.key])
        );
        return sorted;
    }, [result?.rows, sortConfig]);

    // Direct search function - called only when user presses Enter
    const performSearch = useCallback(
        (term: string) => {
            if (!term.trim()) {
                setSearchResults([]);
                setCurrentSearchIndex(0);
                return;
            }

            const searchLower = term.toLowerCase();
            const results: Array<{
                rowIndex: number;
                colIndex: number;
                value: string;
            }> = [];

            // Search through the display rows (which may be sorted) to get correct indices
            const rowsToSearch = sortConfig ? sortedRows : result?.rows || [];
            rowsToSearch.forEach((row, displayIndex) => {
                result?.columns?.forEach((col, colIndex) => {
                    const value = String(row[col.name] || "");
                    if (value.toLowerCase().includes(searchLower)) {
                        results.push({
                            rowIndex: displayIndex, // Use display index for highlighting
                            colIndex,
                            value: String(row[col.name] || ""),
                        });
                    }
                });
            });

            setSearchResults(results);
            setCurrentSearchIndex(0);
        },
        [result?.rows, result?.columns, sortConfig, sortedRows]
    );

    // Initialize default column widths
    const initializeColumnWidths = useCallback(() => {
        if (!result?.columns) return;

        const defaultWidths: { [key: string]: number } = {};
        result.columns.forEach((column) => {
            // Set sensible default widths based on data type and content
            let defaultWidth = 150; // Base width

            // Adjust based on data type
            if (
                column.data_type.includes("varchar") ||
                column.data_type.includes("nvarchar")
            ) {
                defaultWidth = 200;
            } else if (
                column.data_type.includes("text") ||
                column.data_type.includes("ntext")
            ) {
                defaultWidth = 300;
            } else if (
                column.data_type.includes("date") ||
                column.data_type.includes("time")
            ) {
                defaultWidth = 120;
            } else if (
                column.data_type.includes("int") ||
                column.data_type.includes("decimal")
            ) {
                defaultWidth = 100;
            }

            // Adjust based on column name length
            defaultWidth = Math.max(defaultWidth, column.name.length * 8 + 20);

            defaultWidths[column.name] = defaultWidth;
        });

        setColumnWidths(defaultWidths);
    }, [result?.columns]);

    // Initialize widths when result changes
    useEffect(() => {
        initializeColumnWidths();
    }, [initializeColumnWidths]);

    // Only search when user explicitly triggers it
    useEffect(() => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            setCurrentSearchIndex(0);
        }
    }, [searchTerm]);

    const goToNextResult = useCallback(() => {
        if (searchResults.length === 0) return;
        setCurrentSearchIndex((prev) => (prev + 1) % searchResults.length);
    }, [searchResults.length]);

    const goToPrevResult = useCallback(() => {
        if (searchResults.length === 0) return;
        setCurrentSearchIndex(
            (prev) => (prev - 1 + searchResults.length) % searchResults.length
        );
    }, [searchResults.length]);

    // Keyboard navigation for search results
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!searchTerm.trim() || searchResults.length === 0) return;

            if (e.key === "Enter" && e.shiftKey) {
                e.preventDefault();
                goToPrevResult();
            } else if (e.key === "Enter") {
                e.preventDefault();
                goToNextResult();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [searchTerm, searchResults.length, goToNextResult, goToPrevResult]);

    const clearSearch = useCallback(() => {
        setSearchTerm("");
        setSearchResults([]);
        setCurrentSearchIndex(0);
    }, []);

    const handleResizeStart = useCallback(
        (e: React.MouseEvent, columnName: string) => {
            e.preventDefault();
            e.stopPropagation();
            setIsResizing(true);
            setResizeColumn(columnName);
            setResizeStartX(e.clientX);
        },
        []
    );

    const handleResizeMove = useCallback(
        (e: MouseEvent) => {
            if (!isResizing || !resizeColumn) return;

            const deltaX = e.clientX - resizeStartX;
            const newWidth = Math.max(
                50,
                (columnWidths[resizeColumn] || 150) + deltaX
            );

            setColumnWidths((prev) => ({
                ...prev,
                [resizeColumn]: newWidth,
            }));

            setResizeStartX(e.clientX);
        },
        [isResizing, resizeColumn, resizeStartX, columnWidths]
    );

    const handleResizeEnd = useCallback(() => {
        setIsResizing(false);
        setResizeColumn(null);
    }, []);

    // Copy row to clipboard with feedback
    const handleCopyRow = useCallback(
        async (row: Record<string, string>, columns: { name: string }[]) => {
            const success = await copyRowToClipboard(row, columns);
            if (success) {
                // Show success feedback
                const rowIndex = result?.rows.indexOf(row) || 0;
                setCopiedRowIndex(rowIndex);
                setTimeout(() => setCopiedRowIndex(null), 2000);
            }
        },
        [result?.rows]
    );

    // Copy individual cell to clipboard
    const handleCopyCell = useCallback(
        async (value: string, rowIndex: number, colIndex: number) => {
            try {
                await navigator.clipboard.writeText(value);
                setCopiedCell({ rowIndex, colIndex });
                setTimeout(() => setCopiedCell(null), 2000);
            } catch (error) {
                console.error("Failed to copy to clipboard:", error);
            }
        },
        []
    );

    // Handle column sorting
    const handleSort = useCallback((columnName: string) => {
        console.log("Sorting by:", columnName);
        setSortConfig((prev) => {
            if (prev?.key === columnName) {
                // If clicking the same column, toggle direction
                const newDirection = prev.direction === "asc" ? "desc" : "asc";
                console.log("Toggling direction to:", newDirection);
                return {
                    key: columnName,
                    direction: newDirection,
                };
            } else {
                // If clicking a new column, start with ascending
                console.log("New column, starting with ascending");
                return {
                    key: columnName,
                    direction: "asc",
                };
            }
        });
    }, []);

    // Get the rows to display (sorted if sorting is active)
    const displayRows = useMemo(() => {
        if (!result?.rows) return [];

        let rows = sortConfig ? sortedRows : result.rows;

        // Apply search filtering if search is active
        if (searchResults.length > 0) {
            rows = rows.filter((row) =>
                result.columns.some((col) => {
                    const value = String(row[col.name] || "");
                    return value
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase());
                })
            );
        }

        return rows;
    }, [
        result?.rows,
        sortConfig,
        sortedRows,
        searchResults.length,
        searchTerm,
        result?.columns,
    ]);

    // Export functions
    const handleExportJSON = useCallback(() => {
        if (result) exportToJSON(result);
    }, [result]);

    const handleExportCSV = useCallback(() => {
        if (result) exportToCSV(result);
    }, [result]);

    // Add/remove event listeners
    useEffect(() => {
        if (isResizing) {
            document.addEventListener("mousemove", handleResizeMove);
            document.addEventListener("mouseup", handleResizeEnd);
            return () => {
                document.removeEventListener("mousemove", handleResizeMove);
                document.removeEventListener("mouseup", handleResizeEnd);
            };
        }
    }, [isResizing, handleResizeMove, handleResizeEnd]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2">Executing query...</span>
            </div>
        );
    }

    if (error || result?.hasError) {
        const errorMessage =
            error || result?.error || "An unknown error occurred";
        return (
            <div className="p-4 border border-destructive bg-destructive/10 rounded text-destructive text-sm">
                <strong>SQL Error:</strong> {errorMessage}
            </div>
        );
    }

    if (!result) {
        return (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
                No query executed
            </div>
        );
    }

    return (
        <div className="grid grid-rows-[auto_1fr] h-full gap-0">
            {/* Results Header - Fixed height, no overlap */}
            <div className="flex items-center justify-between p-2 border-b border-border bg-card">
                <div className="flex items-center gap-4">
                    {/* View Tabs */}
                    <Tabs
                        value={currentView}
                        onValueChange={(value) =>
                            setCurrentView(value as "table" | "json")
                        }
                    >
                        <TabsList className="h-8">
                            <TabsTrigger
                                value="table"
                                className="text-xs px-3 py-1"
                            >
                                Table
                            </TabsTrigger>
                            <TabsTrigger
                                value="json"
                                className="text-xs px-3 py-1"
                            >
                                JSON
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* Results Info */}
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                            {searchResults.length > 0
                                ? `${searchResults.length} of ${
                                      result.rowCount || result.rows.length
                                  } rows`
                                : `${
                                      result.rowCount || result.rows.length
                                  } rows`}
                        </Badge>
                        {result.executionTime && (
                            <Badge variant="outline" className="text-xs">
                                {result.executionTime}ms
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Search Box */}
                <div className="flex items-center gap-2">
                    <SearchBox
                        placeholder="Search results... (Enter to search, Enter/Shift+Enter to navigate, Esc to clear)"
                        value={searchTerm}
                        onChange={() => {}} // No-op - we don't want to update on every keystroke
                        onClear={clearSearch}
                        onSearch={(inputValue) => {
                            if (inputValue.trim()) {
                                setSearchTerm(inputValue);
                                setIsSearching(true);
                                performSearch(inputValue);
                                setIsSearching(false);
                            }
                        }}
                        onNavigateDown={goToNextResult}
                        onNavigateUp={goToPrevResult}
                        size="lg"
                        className="w-96"
                        inputClassName="text-xs"
                        enableKeyboardShortcut={false}
                    />
                    {isSearching && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                            <span>Searching...</span>
                        </div>
                    )}
                    {searchTerm.trim() &&
                        searchResults.length === 0 &&
                        !isSearching && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span>Press Enter to search</span>
                            </div>
                        )}
                    {searchResults.length > 0 && !isSearching && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>
                                {currentSearchIndex + 1} of{" "}
                                {searchResults.length}
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={goToPrevResult}
                                className="h-6 w-6 p-0"
                                title="Previous result (Shift+Enter)"
                            >
                                ↑
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={goToNextResult}
                                className="h-6 w-6 p-0"
                                title="Next result (Enter)"
                            >
                                ↓
                            </Button>
                            <span className="text-xs text-muted-foreground ml-2">
                                Enter/Shift+Enter to navigate
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportJSON}
                        className="h-7 px-2 text-xs"
                        disabled={result?.hasError}
                        title={
                            result?.hasError
                                ? "Cannot export results with errors"
                                : "Export to JSON"
                        }
                    >
                        <Download className="h-3 w-3 mr-1" />
                        JSON
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportCSV}
                        className="h-7 px-2 text-xs"
                        disabled={result?.hasError}
                        title={
                            result?.hasError
                                ? "Cannot export results with errors"
                                : "Export to CSV"
                        }
                    >
                        <Download className="h-3 w-3 mr-1" />
                        CSV
                    </Button>
                </div>
            </div>

            {/* Results Table - Takes remaining space, no overlap */}
            <div
                className="overflow-auto scrollbar-thin bg-background border border-border rounded-md relative"
                ref={tableRef}
                style={{ cursor: isResizing ? "col-resize" : "default" }}
            >
                {/* Table View */}
                {currentView === "table" && (
                    <div className="w-full min-w-max relative h-full">
                        <Table className="w-full">
                            <TableHeader className="sticky top-0 bg-card border-b border-border z-50 shadow-sm">
                                <TableRow>
                                    {result.columns.map((column, index) => (
                                        <TableHead
                                            key={index}
                                            style={{
                                                width:
                                                    columnWidths[column.name] ||
                                                    150,
                                                minWidth: 50,
                                                maxWidth: 500,
                                            }}
                                            className={cn(
                                                "text-xs font-medium border-r border-border last:border-r-0 relative bg-card",
                                                index === 0 &&
                                                    "sticky left-0 bg-card z-40 shadow-sm border-r-2 border-r-primary/20"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <button
                                                    onClick={() =>
                                                        handleSort(column.name)
                                                    }
                                                    className="flex items-center gap-1 hover:bg-accent/50 px-2 py-1 rounded transition-colors cursor-pointer flex-1 text-left"
                                                    title={`Click to sort by ${column.name}`}
                                                >
                                                    <span className="truncate">
                                                        {column.name}
                                                    </span>
                                                    {sortConfig?.key ===
                                                        column.name && (
                                                        <div className="flex flex-col text-muted-foreground">
                                                            {sortConfig.direction ===
                                                            "asc" ? (
                                                                <span className="text-primary">
                                                                    ↑
                                                                </span>
                                                            ) : (
                                                                <span className="text-primary">
                                                                    ↓
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </button>
                                                {index <
                                                    result.columns.length -
                                                        1 && (
                                                    <div
                                                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/20"
                                                        onMouseDown={(e) =>
                                                            handleResizeStart(
                                                                e,
                                                                column.name
                                                            )
                                                        }
                                                    />
                                                )}
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(() => {
                                    if (
                                        searchResults.length > 0 &&
                                        displayRows.length === 0
                                    ) {
                                        return (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={
                                                        result.columns.length
                                                    }
                                                    className="text-center py-8 text-muted-foreground"
                                                >
                                                    No results found for "
                                                    {searchTerm}"
                                                </TableCell>
                                            </TableRow>
                                        );
                                    }

                                    return displayRows.map((row, rowIndex) => {
                                        // Find the original index in the unsorted rows for proper highlighting
                                        const originalRowIndex =
                                            result.rows.indexOf(row);
                                        return (
                                            <TableRow
                                                key={originalRowIndex}
                                                className="hover:bg-accent/50 group relative"
                                            >
                                                {result.columns.map(
                                                    (column, cellIndex) => {
                                                        const cellValue =
                                                            String(
                                                                row[
                                                                    column.name
                                                                ] || ""
                                                            );
                                                        const isSearchMatch =
                                                            searchResults.some(
                                                                (
                                                                    result,
                                                                    index
                                                                ) =>
                                                                    result.rowIndex ===
                                                                        originalRowIndex &&
                                                                    result.colIndex ===
                                                                        cellIndex &&
                                                                    index ===
                                                                        currentSearchIndex
                                                            );

                                                        const isCurrentResult =
                                                            searchResults.some(
                                                                (
                                                                    result,
                                                                    index
                                                                ) =>
                                                                    result.rowIndex ===
                                                                        originalRowIndex &&
                                                                    result.colIndex ===
                                                                        cellIndex &&
                                                                    index ===
                                                                        currentSearchIndex
                                                            );

                                                        const isCopied =
                                                            copiedCell?.rowIndex ===
                                                                originalRowIndex &&
                                                            copiedCell?.colIndex ===
                                                                cellIndex;

                                                        return (
                                                            <TableCell
                                                                key={cellIndex}
                                                                style={{
                                                                    width:
                                                                        columnWidths[
                                                                            column
                                                                                .name
                                                                        ] ||
                                                                        150,
                                                                    minWidth: 50,
                                                                    maxWidth: 500,
                                                                }}
                                                                className={cn(
                                                                    "text-xs border-r border-border last:border-r-0 font-mono whitespace-nowrap overflow-hidden relative group/cell",
                                                                    // Only highlight when there are actual search results
                                                                    searchResults.length >
                                                                        0 &&
                                                                        isSearchMatch &&
                                                                        "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100",
                                                                    searchResults.length >
                                                                        0 &&
                                                                        isCurrentResult &&
                                                                        "bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-background font-semibold",
                                                                    cellIndex ===
                                                                        0 &&
                                                                        "sticky left-0 bg-background z-40 shadow-sm border-r-2 border-r-primary/20"
                                                                )}
                                                            >
                                                                <div
                                                                    className="truncate relative"
                                                                    title={
                                                                        cellValue
                                                                    }
                                                                >
                                                                    {row[
                                                                        column
                                                                            .name
                                                                    ] ===
                                                                        null ||
                                                                    row[
                                                                        column
                                                                            .name
                                                                    ] ===
                                                                        undefined ? (
                                                                        <span className="text-muted-foreground italic">
                                                                            NULL
                                                                        </span>
                                                                    ) : (
                                                                        cellValue
                                                                    )}

                                                                    {/* Copy icon overlay */}
                                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/cell:opacity-100 transition-opacity">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={(
                                                                                e
                                                                            ) => {
                                                                                e.stopPropagation();
                                                                                handleCopyCell(
                                                                                    cellValue,
                                                                                    originalRowIndex,
                                                                                    cellIndex
                                                                                );
                                                                            }}
                                                                            className="h-6 w-6 p-0 bg-background/90 hover:bg-background border shadow-sm"
                                                                            title="Copy to clipboard"
                                                                        >
                                                                            {isCopied ? (
                                                                                <Check className="h-3 w-3 text-green-600" />
                                                                            ) : (
                                                                                <Copy className="h-3 w-3" />
                                                                            )}
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                        );
                                                    }
                                                )}
                                            </TableRow>
                                        );
                                    });
                                })()}
                            </TableBody>
                        </Table>

                        {/* Copy buttons positioned absolutely over table rows */}
                        {(() => {
                            if (!result?.rows || !result?.columns) return null;

                            return displayRows.map((row, rowIndex) => {
                                const originalRowIndex =
                                    result.rows.indexOf(row);
                                return (
                                    <div
                                        key={`copy-${originalRowIndex}`}
                                        className="absolute opacity-0 hover:opacity-100 transition-opacity pointer-events-none"
                                        style={{
                                            top: `${
                                                (originalRowIndex + 1) * 32 + 40
                                            }px`,
                                            right: "8px",
                                        }}
                                    >
                                        <div className="pointer-events-auto">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    handleCopyRow(
                                                        row,
                                                        result.columns
                                                    )
                                                }
                                                className="h-6 w-6 p-0 bg-background/80 backdrop-blur-sm"
                                                title="Copy row to clipboard"
                                            >
                                                {copiedRowIndex === rowIndex ? (
                                                    <Check className="h-3 w-3 text-green-600" />
                                                ) : (
                                                    <Copy className="h-3 w-3" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                )}

                {/* JSON View */}
                {currentView === "json" && (
                    <div className="h-full p-4">
                        <div className="h-full overflow-auto">
                            <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-words bg-muted/30 p-4 rounded-md border">
                                {JSON.stringify(result.rows, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

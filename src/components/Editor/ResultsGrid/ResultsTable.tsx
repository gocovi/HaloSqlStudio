import { forwardRef, useMemo, memo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QueryResult } from "@/services/api/types";
import { useResultsSorting } from "./hooks/useResultsSorting";
import { useColumnResize } from "./hooks/useColumnResize";
import { useResultsCopy } from "./hooks/useResultsCopy";
import { useResultsSearch } from "./hooks/useResultsSearch";

interface ResultsTableProps {
    result: QueryResult;
    searchTerm: string;
    currentView: "table" | "json";
}

export const ResultsTable = forwardRef<HTMLDivElement, ResultsTableProps>(
    ({ result, searchTerm, currentView }, ref) => {
        const { sortConfig, handleSort, sortedRows } =
            useResultsSorting(result);
        const { columnWidths, isResizing, handleResizeStart } =
            useColumnResize(result);
        const { copiedRowIndex, copiedCell, handleCopyRow, handleCopyCell } =
            useResultsCopy();
        const { searchResults, currentSearchIndex } = useResultsSearch(
            result,
            searchTerm
        );

        // Get the rows to display (sorted if sorting is active)
        const displayRows = useMemo(() => {
            if (!result?.rows) return [];

            let rows = sortConfig ? sortedRows : result.rows;

            // Apply search filtering if search results are available
            if (searchResults.length > 0) {
                // Create a Set of row indices that match the search for O(1) lookup
                const matchingRowIndices = new Set(
                    searchResults.map((result) => result.rowIndex)
                );

                // Filter rows based on the pre-computed search results
                rows = rows.filter((_, index) => {
                    const originalIndex = result.rows.indexOf(rows[index]);
                    return matchingRowIndices.has(originalIndex);
                });
            }

            return rows;
        }, [result?.rows, sortConfig, sortedRows, searchResults]);

        if (currentView === "json") {
            return (
                <div className="h-full p-4">
                    <div className="h-full overflow-auto">
                        <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-words bg-muted/30 p-4 rounded-md border">
                            {JSON.stringify(result.rows, null, 2)}
                        </pre>
                    </div>
                </div>
            );
        }

        return (
            <div
                className="overflow-auto scrollbar-thin bg-background border border-border rounded-md relative"
                ref={ref}
                style={{ cursor: isResizing ? "col-resize" : "default" }}
            >
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
                                                result.columns.length - 1 && (
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
                                    searchTerm.trim() &&
                                    displayRows.length === 0
                                ) {
                                    return (
                                        <TableRow>
                                            <TableCell
                                                colSpan={result.columns.length}
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
                                        <MemoizedTableRow
                                            key={originalRowIndex}
                                            row={row}
                                            rowIndex={originalRowIndex}
                                            columns={result.columns}
                                            searchResults={searchResults}
                                            currentSearchIndex={
                                                currentSearchIndex
                                            }
                                            columnWidths={columnWidths}
                                            sortConfig={sortConfig}
                                            onSort={handleSort}
                                            onResizeStart={handleResizeStart}
                                            onCopyRow={handleCopyRow}
                                            onCopyCell={handleCopyCell}
                                            copiedRowIndex={copiedRowIndex}
                                            copiedCell={copiedCell}
                                        />
                                    );
                                });
                            })()}
                        </TableBody>
                    </Table>

                    {/* Copy buttons positioned absolutely over table rows */}
                    {(() => {
                        if (!result?.rows || !result?.columns) return null;

                        return displayRows.map((row, rowIndex) => {
                            const originalRowIndex = result.rows.indexOf(row);
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
            </div>
        );
    }
);

ResultsTable.displayName = "ResultsTable";

// Memoized table row component to prevent unnecessary re-renders
const MemoizedTableRow = memo(
    ({
        row,
        rowIndex,
        columns,
        searchResults,
        currentSearchIndex,
        columnWidths,
        sortConfig,
        onSort,
        onResizeStart,
        onCopyRow,
        onCopyCell,
        copiedRowIndex,
        copiedCell,
    }: {
        row: Record<string, string>;
        rowIndex: number;
        columns: { name: string }[];
        searchResults: Array<{
            rowIndex: number;
            colIndex: number;
            value: string;
        }>;
        currentSearchIndex: number;
        columnWidths: Record<string, number>;
        sortConfig: { key: string; direction: "asc" | "desc" } | null;
        onSort: (columnName: string) => void;
        onResizeStart: (e: React.MouseEvent, columnName: string) => void;
        onCopyRow: (
            row: Record<string, string>,
            columns: { name: string }[]
        ) => void;
        onCopyCell: (value: string, rowIndex: number, colIndex: number) => void;
        copiedRowIndex: number | null;
        copiedCell: { rowIndex: number; colIndex: number } | null;
    }) => {
        return (
            <TableRow className="hover:bg-accent/50 group relative">
                {columns.map((column, cellIndex) => {
                    const cellValue = String(row[column.name] || "");
                    const isSearchMatch = searchResults.some(
                        (result) =>
                            result.rowIndex === rowIndex &&
                            result.colIndex === cellIndex
                    );

                    const isCurrentResult = searchResults.some(
                        (result, index) =>
                            result.rowIndex === rowIndex &&
                            result.colIndex === cellIndex &&
                            index === currentSearchIndex
                    );

                    const isCopied =
                        copiedCell?.rowIndex === rowIndex &&
                        copiedCell?.colIndex === cellIndex;

                    return (
                        <TableCell
                            key={cellIndex}
                            style={{
                                width: columnWidths[column.name] || 150,
                                minWidth: 50,
                                maxWidth: 500,
                            }}
                            className={cn(
                                "text-xs border-r border-border last:border-r-0 font-mono whitespace-nowrap overflow-hidden relative group/cell",
                                // First column sticky styling (but don't override search highlights)
                                cellIndex === 0 &&
                                    "sticky left-0 z-40 shadow-sm border-r-2 border-r-primary/20",
                                // Search highlighting - takes precedence over background
                                searchResults.length > 0 &&
                                    isSearchMatch &&
                                    "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100",
                                searchResults.length > 0 &&
                                    isCurrentResult &&
                                    "bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-background font-semibold",
                                // Background for first column when not highlighted
                                cellIndex === 0 &&
                                    !isSearchMatch &&
                                    !isCurrentResult &&
                                    "bg-background"
                            )}
                        >
                            <div
                                className="truncate relative"
                                title={cellValue}
                            >
                                {row[column.name] === null ||
                                row[column.name] === undefined ? (
                                    <span className="text-muted-foreground italic">
                                        NULL
                                    </span>
                                ) : (
                                    cellValue
                                )}

                                {/* Copy icon overlay */}
                                {sortConfig?.key === column.name && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/cell:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onCopyCell(
                                                    cellValue,
                                                    rowIndex,
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
                                )}
                            </div>
                        </TableCell>
                    );
                })}
            </TableRow>
        );
    }
);

MemoizedTableRow.displayName = "MemoizedTableRow";

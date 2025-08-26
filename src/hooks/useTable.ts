import { useState, useCallback, useEffect, useRef } from "react";

interface UseTableOptions {
    columns: { name: string }[] | null;
}

export function useTable({ columns }: UseTableOptions) {
    const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>(
        {}
    );
    const [isResizing, setIsResizing] = useState(false);
    const [resizeStartX, setResizeStartX] = useState(0);
    const [resizeColumn, setResizeColumn] = useState<string | null>(null);
    const tableRef = useRef<HTMLDivElement>(null);

    // Initialize default column widths
    const initializeColumnWidths = useCallback(() => {
        if (!columns) return;

        const defaultWidths: { [key: string]: number } = {};
        columns.forEach((column) => {
            // Set sensible default widths based on data type and content
            let defaultWidth = 150; // Base width

            // Adjust based on column name length
            defaultWidth = Math.max(defaultWidth, column.name.length * 8 + 20);

            defaultWidths[column.name] = defaultWidth;
        });

        setColumnWidths(defaultWidths);
    }, [columns]);

    // Initialize widths when columns change
    useEffect(() => {
        initializeColumnWidths();
    }, [initializeColumnWidths]);

    const handleResizeStart = useCallback(
        (e: React.MouseEvent, columnName: string) => {
            e.preventDefault();
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
            setColumnWidths((prev) => ({
                ...prev,
                [resizeColumn]: Math.max(
                    50,
                    (prev[resizeColumn] || 150) + deltaX
                ),
            }));
            setResizeStartX(e.clientX);
        },
        [isResizing, resizeColumn, resizeStartX]
    );

    const handleResizeEnd = useCallback(() => {
        setIsResizing(false);
        setResizeColumn(null);
    }, []);

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

    // Scroll to a specific row
    const scrollToRow = useCallback((rowIndex: number) => {
        if (!tableRef.current) return;

        const tableElement = tableRef.current;
        const rowHeight = 32; // Approximate row height
        const headerHeight = 40; // Approximate header height
        const targetScrollTop = (rowIndex + 1) * rowHeight + headerHeight;

        // Smooth scroll to the target row
        tableElement.scrollTo({
            top: Math.max(0, targetScrollTop - 100), // Offset by 100px for better visibility
            behavior: "smooth",
        });
    }, []);

    return {
        // State
        columnWidths,
        isResizing,

        // Refs
        tableRef,

        // Actions
        handleResizeStart,
        scrollToRow,
    };
}

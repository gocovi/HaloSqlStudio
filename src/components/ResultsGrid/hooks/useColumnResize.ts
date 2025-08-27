import { useState, useCallback, useEffect, useMemo } from "react";
import type { QueryResult } from "@/lib/halo-api";

export function useColumnResize(result: QueryResult) {
    const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>(
        {}
    );
    const [isResizing, setIsResizing] = useState(false);
    const [resizeStartX, setResizeStartX] = useState(0);
    const [resizeColumn, setResizeColumn] = useState<string | null>(null);

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

    return {
        columnWidths,
        isResizing,
        handleResizeStart,
    };
}

import { Button } from "@/components/ui/button";
import type { QueryResult } from "@/services/api/types";
import { exportToJSON, exportToCSV } from "@/lib/export-utils";

interface ResultsHeaderProps {
    result: QueryResult;
    globalFilter: string;
    onGlobalFilterChange: (filter: string) => void;
}

export function ResultsHeader({
    result,
    globalFilter,
    onGlobalFilterChange,
}: ResultsHeaderProps) {
    const handleExportJSON = () => {
        exportToJSON(result);
    };

    const handleExportCSV = () => {
        exportToCSV(result);
    };

    return (
        <div className="flex items-center justify-between p-2 border-b border-border bg-card">
            {/* Left side: Search Box */}
            <div className="flex items-center gap-4">
                {/* Global Search */}
                <div className="flex items-center space-x-2">
                    <svg
                        className="w-4 h-4 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search rows..."
                        value={globalFilter}
                        onChange={(e) => onGlobalFilterChange(e.target.value)}
                        className="w-64 px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                    />
                    {globalFilter && (
                        <button
                            onClick={() => onGlobalFilterChange("")}
                            className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Right side: Export buttons */}
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                    className="text-xs"
                >
                    Export CSV
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportJSON}
                    className="text-xs"
                >
                    Export JSON
                </Button>
            </div>
        </div>
    );
}

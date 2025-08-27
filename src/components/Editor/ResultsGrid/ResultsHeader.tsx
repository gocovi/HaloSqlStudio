import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchBox } from "@/components/ui/search-box";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download } from "lucide-react";
import type { QueryResult } from "@/services/api/types";
import { exportToJSON, exportToCSV } from "@/lib/export-utils";
import { useResultsSearch } from "@/components/ResultsGrid/hooks/useResultsSearch";

interface ResultsHeaderProps {
    result: QueryResult;
    searchTerm: string;
    onSearchTermChange: (term: string) => void;
    currentView: "table" | "json";
    onViewChange: (view: "table" | "json") => void;
}

export function ResultsHeader({
    result,
    searchTerm,
    onSearchTermChange,
    currentView,
    onViewChange,
}: ResultsHeaderProps) {
    const {
        searchResults,
        currentSearchIndex,
        isSearching,
        isSearchFocused,
        setIsSearchFocused,
        performImmediateSearch,
        goToNextResult,
        goToPrevResult,
        clearSearch,
    } = useResultsSearch(result, searchTerm);

    const handleExportJSON = () => {
        exportToJSON(result);
    };

    const handleExportCSV = () => {
        exportToCSV(result);
    };

    return (
        <div className="flex items-center justify-between p-2 border-b border-border bg-card">
            {/* Left side: View Tabs, Search Box, and Search Results */}
            <div className="flex items-center gap-4">
                {/* View Tabs */}
                <Tabs
                    value={currentView}
                    onValueChange={(value) =>
                        onViewChange(value as "table" | "json")
                    }
                >
                    <TabsList className="h-8">
                        <TabsTrigger
                            value="table"
                            className="text-xs px-3 py-1"
                        >
                            Table
                        </TabsTrigger>
                        <TabsTrigger value="json" className="text-xs px-3 py-1">
                            JSON
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Search Box */}
                <SearchBox
                    placeholder="Search"
                    value={searchTerm}
                    onChange={onSearchTermChange}
                    onClear={clearSearch}
                    onSearch={performImmediateSearch}
                    onNavigateDown={goToNextResult}
                    onNavigateUp={goToPrevResult}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    size="lg"
                    className="w-72"
                    inputClassName="text-xs"
                    enableKeyboardShortcut={false}
                    loading={isSearching}
                />

                {/* Search Results and Navigation */}
                {searchResults.length > 0 && !isSearching && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>
                            {currentSearchIndex + 1} of {searchResults.length}
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
                    </div>
                )}
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

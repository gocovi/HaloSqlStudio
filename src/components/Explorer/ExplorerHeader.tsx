import React from "react";
import { Database, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBox } from "@/components/ui/search-box";
import { useExplorerStore } from "@/stores/explorerStore";
import { useApi } from "@/hooks/useApi";

export function ExplorerHeader() {
    const {
        activeTab,
        searchQuery,
        setSearchQuery,
        refreshReports,
        refreshTables,
        isLoadingTables,
        isLoadingReports,
    } = useExplorerStore();

    const { getTables, getReports } = useApi();

    const handleRefresh = async () => {
        if (activeTab === "tables") {
            refreshTables();
        } else {
            refreshReports();
        }
    };

    return (
        <>
            {/* Header */}
            <div className="p-3 border-b border-border">
                <div className="flex items-center gap-2 mb-3">
                    <Database className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">
                        Database Explorer
                    </span>
                </div>

                {/* Search */}
                <SearchBox
                    placeholder={`Search ${
                        activeTab === "tables"
                            ? "tables and columns"
                            : "reports and SQL"
                    }...`}
                    value={searchQuery}
                    onChange={setSearchQuery}
                    size="sm"
                    className="w-full"
                    inputClassName="text-xs bg-input border-border"
                    enableKeyboardShortcut={true}
                />
            </div>

            {/* Refresh Button */}
            <div className="border-b border-border">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    className="w-full justify-center p-6 h-8 hover:bg-accent"
                    disabled={isLoadingTables || isLoadingReports}
                >
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>
        </>
    );
}

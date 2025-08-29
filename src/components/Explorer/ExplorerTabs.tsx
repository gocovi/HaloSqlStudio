import React from "react";
import { Table, FileText } from "lucide-react";
import { useExplorerStore } from "@/stores/explorerStore";

interface ExplorerTabsProps {
    onTabChange: (tab: "tables" | "reports") => void;
}

export function ExplorerTabs({ onTabChange }: ExplorerTabsProps) {
    const { activeTab, setActiveTab } = useExplorerStore();

    const handleTabChange = async (tab: "tables" | "reports") => {
        setActiveTab(tab);
        await onTabChange(tab);
    };

    return (
        <div className="flex w-full">
            <button
                onClick={() => handleTabChange("tables")}
                className={`flex-1 flex items-center justify-center text-xs font-medium transition-all duration-200 relative border-b-2 min-h-[44px] ${
                    activeTab === "tables"
                        ? "text-foreground border-primary bg-accent/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50 border-transparent"
                }`}
            >
                <Table className="h-3 w-3 mr-2" />
                Tables
            </button>
            <button
                onClick={() => handleTabChange("reports")}
                className={`flex-1 flex items-center justify-center text-xs font-medium transition-all duration-200 relative border-b-2 min-h-[44px] ${
                    activeTab === "reports"
                        ? "text-foreground border-primary bg-accent/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50 border-transparent"
                }`}
            >
                <FileText className="h-3 w-3 mr-2" />
                Reports
            </button>
        </div>
    );
}

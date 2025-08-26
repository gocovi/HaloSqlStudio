import { useState } from "react";
import { X, Plus, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  title: string;
  content: React.ReactNode;
  isPinned?: boolean;
}

interface QueryTabsProps {
  tabs: Tab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onNewTab: () => void;
}

export function QueryTabs({ tabs, activeTabId, onTabChange, onTabClose, onNewTab }: QueryTabsProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Tab Bar */}
      <div className="flex items-center bg-card border-b border-border">
        <div className="flex overflow-x-auto scrollbar-none">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                "flex items-center min-w-0 border-r border-border group",
                activeTabId === tab.id ? "bg-tab-active" : "bg-tab-background hover:bg-accent"
              )}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTabChange(tab.id)}
                className="flex-1 justify-start px-3 py-2 h-auto rounded-none text-xs font-normal min-w-0"
              >
                {tab.isPinned && <Terminal className="h-3 w-3 mr-2 text-primary flex-shrink-0" />}
                <span className="truncate max-w-32">{tab.title}</span>
              </Button>
              
              {!tab.isPinned && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6 rounded-none hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onNewTab}
          className="p-2 h-8 w-8 ml-auto mr-2"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {tabs.find(tab => tab.id === activeTabId)?.content}
      </div>
    </div>
  );
}
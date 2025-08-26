import { useState, useRef } from "react";
import { X, Plus, Terminal, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
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
    editingTabId: string | null;
    onTabChange: (tabId: string) => void;
    onTabClose: (tabId: string) => void;
    onCloseAllTabs?: () => void;
    onNewTab: () => void;
    onTabTitleEdit?: (tabId: string, newTitle: string) => void;
    onStartEditing?: (tabId: string) => void;
}

export function QueryTabs({
    tabs,
    activeTabId,
    editingTabId,
    onTabChange,
    onTabClose,
    onCloseAllTabs,
    onNewTab,
    onTabTitleEdit,
    onStartEditing,
}: QueryTabsProps) {
    const [editingTitle, setEditingTitle] = useState("");

    const handleDoubleClick = (tab: Tab) => {
        if (tab.isPinned || !onStartEditing) return;
        setEditingTitle(tab.title);
        onStartEditing(tab.id);
    };

    const handleTitleSubmit = (tabId: string) => {
        if (
            editingTitle.trim() &&
            editingTitle !== tabs.find((t) => t.id === tabId)?.title
        ) {
            onTabTitleEdit?.(tabId, editingTitle.trim());
        }
        setEditingTitle("");
    };

    const handleTitleCancel = () => {
        setEditingTitle("");
    };

    const handleKeyDown = (e: React.KeyboardEvent, tabId: string) => {
        if (e.key === "Enter") {
            handleTitleSubmit(tabId);
        } else if (e.key === "Escape") {
            handleTitleCancel();
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Tab Bar */}
            <div className="flex items-center bg-card border-b border-border">
                <div className="flex overflow-x-auto scrollbar-thin">
                    {tabs.map((tab) => (
                        <div
                            key={tab.id}
                            className={cn(
                                "flex items-center min-w-0 border-r border-border group",
                                activeTabId === tab.id
                                    ? "bg-tab-active"
                                    : "bg-tab-background hover:bg-accent"
                            )}
                        >
                            {editingTabId === tab.id ? (
                                <div className="flex items-center px-3 py-2 min-w-0">
                                    <Input
                                        value={editingTitle}
                                        onChange={(e) =>
                                            setEditingTitle(e.target.value)
                                        }
                                        onKeyDown={(e) =>
                                            handleKeyDown(e, tab.id)
                                        }
                                        onBlur={() => handleTitleSubmit(tab.id)}
                                        className="h-6 text-xs px-2 py-1 min-w-0 w-32"
                                        autoFocus
                                    />
                                </div>
                            ) : (
                                <ContextMenu>
                                    <ContextMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onTabChange(tab.id)}
                                            onDoubleClick={() =>
                                                handleDoubleClick(tab)
                                            }
                                            className="flex-1 justify-start px-3 py-2 h-auto rounded-none text-xs font-normal min-w-0"
                                            title={
                                                tab.isPinned
                                                    ? "Console tab (cannot rename)"
                                                    : "Double-click to rename"
                                            }
                                        >
                                            {tab.isPinned && (
                                                <Terminal className="h-3 w-3 mr-2 text-primary flex-shrink-0" />
                                            )}
                                            <span className="truncate max-w-32">
                                                {tab.title}
                                            </span>
                                        </Button>
                                    </ContextMenuTrigger>
                                    <ContextMenuContent>
                                        {!tab.isPinned && (
                                            <>
                                                <ContextMenuItem
                                                    onClick={() =>
                                                        onTabClose(tab.id)
                                                    }
                                                >
                                                    <X className="h-4 w-4 mr-2" />
                                                    Close Tab
                                                </ContextMenuItem>
                                                <ContextMenuSeparator />
                                            </>
                                        )}
                                        {onCloseAllTabs && tabs.length > 1 && (
                                            <ContextMenuItem
                                                onClick={onCloseAllTabs}
                                            >
                                                <MoreHorizontal className="h-4 w-4 mr-2" />
                                                Close All Tabs
                                            </ContextMenuItem>
                                        )}
                                    </ContextMenuContent>
                                </ContextMenu>
                            )}

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
                    className="p-2 h-8 w-8 rounded-none"
                >
                    <Plus className="h-3 w-3" />
                </Button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
                {tabs.find((tab) => tab.id === activeTabId)?.content}
            </div>
        </div>
    );
}

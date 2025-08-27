import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Play, Plus, X, MoreHorizontal, Terminal, Save } from "lucide-react";

interface Tab {
    id: string;
    title: string;
    isPinned?: boolean;
    isReport?: boolean;
    hasUnsavedChanges?: boolean;
    content?: React.ReactNode; // Add content property for React components
}

interface QueryTabsProps {
    tabs: Tab[];
    activeTabId: string | null;
    editingTabId: string | null;
    onTabChange: (tabId: string) => void;
    onTabClose: (tabId: string) => void;
    onCloseAllTabs?: () => void;
    onNewTab: () => void;
    onTabTitleEdit: (tabId: string, newTitle: string) => void;
    onStartEditing: (tab: Tab) => void;
    onExecute?: () => void;
    onSave?: () => void; // Changed from (tabId: string) => void
    readOnly?: boolean;
    activeTabRef?: React.RefObject<{ execute: () => void; save: () => void }>;
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
    onExecute,
    onSave,
    readOnly = false,
    activeTabRef,
}: QueryTabsProps) {
    const [editingTitle, setEditingTitle] = useState("");

    const handleDoubleClick = (tab: Tab) => {
        if (tab.isPinned || !onStartEditing) return;
        setEditingTitle(tab.title);
        onStartEditing(tab);
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
                {/* Execute button - positioned to the left of tabs */}
                {onExecute && (
                    <div className="flex items-center border-r border-border">
                        <button
                            onClick={onExecute}
                            disabled={readOnly}
                            className="flex items-center justify-center h-8 w-8 rounded hover:bg-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title={
                                readOnly
                                    ? "Cannot execute in read-only mode"
                                    : "Execute query (Ctrl+Enter)"
                            }
                        >
                            <Play className="h-5 w-5 text-green-500" />
                        </button>
                    </div>
                )}

                {/* Save button - always visible for report tabs, but disabled when appropriate */}
                {onSave &&
                    activeTabId &&
                    (() => {
                        const activeTab = tabs.find(
                            (t) => t.id === activeTabId
                        );
                        const canSave =
                            activeTab?.isReport &&
                            activeTab?.hasUnsavedChanges &&
                            !readOnly;

                        // Always show save button for report tabs, but disable when appropriate
                        if (activeTab?.isReport) {
                            return (
                                <div className="flex items-center border-r border-border">
                                    <button
                                        onClick={() => onSave?.()}
                                        disabled={!canSave}
                                        className="flex items-center justify-center h-8 w-8 rounded hover:bg-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        title={
                                            !canSave
                                                ? readOnly
                                                    ? "Cannot save in read-only mode"
                                                    : activeTab?.hasUnsavedChanges
                                                    ? "No changes to save"
                                                    : "Save changes to report"
                                                : "Save changes to report"
                                        }
                                    >
                                        <Save className="h-5 w-5 text-blue-500" />
                                    </button>
                                </div>
                            );
                        }
                        return null;
                    })()}

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

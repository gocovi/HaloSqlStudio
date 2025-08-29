import React, { useState, useEffect } from "react";
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Play, Plus, X, Save, Variable, Bell } from "lucide-react";
import { useEditorStore } from "../store/editorStore";
import { ReportTab } from "./ReportTab";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { VariablesDialog } from "../VariablesDialog";
import { WarningsDropdown } from "../WarningsDropdown";
import { warningRegistry, type WarningResult } from "@/lib/warnings";

export function Tabs() {
    const {
        tabs,
        activeTabId,
        editingTabId,
        variables,
        setActiveTab,
        closeTab,
        startEditingTab,
        stopEditingTab,
        updateTab,
        addTab,
        saveReport,
        executeQuery,
        setVariables,
    } = useEditorStore();

    const { updateReport, executeQuery: executeQueryApi } = useApi();
    const { toast } = useToast();

    const [editingTitle, setEditingTitle] = useState("");
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [showVariablesDialog, setShowVariablesDialog] = useState(false);
    const [showWarningsPanel, setShowWarningsPanel] = useState(false);
    const [warnings, setWarnings] = useState<WarningResult[]>([]);

    const handleDoubleClick = (tab: {
        id: string;
        title: string;
        isPinned: boolean;
    }) => {
        if (tab.isPinned || !startEditingTab) return;
        setEditingTitle(tab.title);
        startEditingTab(tab.id);
    };

    const handleTitleSubmit = (tabId: string) => {
        if (
            editingTitle.trim() &&
            editingTitle !== tabs.find((t) => t.id === tabId)?.title
        ) {
            updateTab(tabId, { title: editingTitle.trim() });
        }
        setEditingTitle("");
        stopEditingTab();
    };

    const handleTitleCancel = () => {
        setEditingTitle("");
        stopEditingTab();
    };

    const handleKeyDown = (e: React.KeyboardEvent, tabId: string) => {
        if (e.key === "Enter") {
            handleTitleSubmit(tabId);
        } else if (e.key === "Escape") {
            handleTitleCancel();
        }
    };

    const handleNewTab = () => {
        addTab(`Query ${tabs.length + 1}`);
    };

    // Test warning detection
    useEffect(() => {
        // Test with a simple SQL that should trigger warnings
        const testSql = "SELECT * FROM profiles -- This is a comment";
        const testWarnings = warningRegistry.scan(testSql);
        console.log("Test warnings:", testWarnings);
    }, []);

    const handleExecute = async () => {
        if (activeTabId) {
            try {
                await executeQuery(activeTabId, executeQueryApi);
                toast({
                    title: "Query executed",
                    description: "Your query has been executed successfully.",
                });
            } catch (error) {
                toast({
                    title: "Execution failed",
                    description:
                        error instanceof Error
                            ? error.message
                            : "Failed to execute query.",
                    variant: "destructive",
                });
            }
        }
    };

    const handleSaveClick = () => {
        setShowSaveConfirm(true);
    };

    const handleSaveConfirm = async () => {
        if (activeTabId) {
            try {
                await saveReport(activeTabId, updateReport);
                toast({
                    title: "Report saved",
                    description: "Your report has been saved successfully.",
                });
            } catch (error) {
                toast({
                    title: "Save failed",
                    description:
                        error instanceof Error
                            ? error.message
                            : "Failed to save report changes.",
                    variant: "destructive",
                });
            }
        }
        setShowSaveConfirm(false);
    };

    const handleSaveCancel = () => {
        setShowSaveConfirm(false);
    };

    const activeTab = tabs.find((t) => t.id === activeTabId);
    const canSave = activeTab?.isReport && activeTab?.hasUnsavedChanges;

    // Scan for warnings when active tab changes or SQL changes
    useEffect(() => {
        if (activeTabId && activeTab) {
            const newWarnings = warningRegistry.scan(activeTab.sql);
            setWarnings(newWarnings);
        }
    }, [activeTabId, activeTab?.sql]);

    // Close warnings dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showWarningsPanel && event.target) {
                const target = event.target as Element;
                if (!target.closest(".warnings-dropdown-container")) {
                    setShowWarningsPanel(false);
                }
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [showWarningsPanel]);

    const handleFixWarning = (warningResult: WarningResult) => {
        if (activeTabId && warningResult.warning.fix) {
            const fixedSql = warningResult.warning.fix(activeTab.sql);
            updateTab(activeTabId, { sql: fixedSql });

            // Re-scan for warnings after fix
            const newWarnings = warningRegistry.scan(fixedSql);
            setWarnings(newWarnings);

            toast({
                title: "Warning Fixed",
                description: "The SQL has been automatically fixed.",
            });
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Tab Bar */}
            <div className="flex items-center bg-card border-b border-border">
                {/* Execute button */}
                <div className="flex items-center border-r border-border">
                    <button
                        onClick={handleExecute}
                        className="flex items-center justify-center h-10 w-10 rounded hover:bg-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Execute query (Ctrl+Enter)"
                    >
                        <Play className="h-5 w-5 text-green-500" />
                    </button>
                </div>

                {/* Variables button */}
                <div className="flex items-center border-r border-border">
                    <button
                        onClick={() => setShowVariablesDialog(true)}
                        className="flex items-center justify-center h-10 w-10 rounded hover:bg-accent/50 transition-colors relative"
                        title={`Edit Halo variables${
                            variables.$agentid ||
                            variables.$siteid ||
                            variables.$clientid
                                ? `\n\nActive variables:\n${
                                      variables.$agentid
                                          ? `$agentid: ${variables.$agentid}\n`
                                          : ""
                                  }${
                                      variables.$siteid
                                          ? `$siteid: ${variables.$siteid}\n`
                                          : ""
                                  }${
                                      variables.$clientid
                                          ? `$clientid: ${variables.$clientid}`
                                          : ""
                                  }`
                                : "\n\nNo variables set - will use logged-in user values"
                        }`}
                    >
                        <Variable className="h-5 w-5 text-blue-500" />
                        {/* Show indicator when any variables are set */}
                        {(variables.$agentid ||
                            variables.$siteid ||
                            variables.$clientid) && (
                            <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background z-10"></div>
                        )}
                    </button>
                </div>

                {/* Warnings button */}
                <div className="flex items-center border-r border-border relative warnings-dropdown-container">
                    <button
                        onClick={() => setShowWarningsPanel(!showWarningsPanel)}
                        className="flex items-center justify-center h-10 w-10 rounded hover:bg-accent/50 transition-colors relative"
                        title={`Code Warnings${
                            warnings.length > 0
                                ? `\n\n${warnings.length} warning${
                                      warnings.length === 1 ? "" : "s"
                                  } found`
                                : "\n\nNo warnings found"
                        }`}
                    >
                        <Bell className="h-5 w-5 text-orange-500" />
                        {/* Show indicator when warnings exist */}
                        {warnings.length > 0 && (
                            <div className="absolute top-1 right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-background flex items-center justify-center z-10">
                                <span className="text-xs text-white font-bold leading-none">
                                    {warnings.length > 9
                                        ? "9+"
                                        : warnings.length}
                                </span>
                            </div>
                        )}
                    </button>

                    {/* Warnings Dropdown */}
                    {showWarningsPanel && (
                        <WarningsDropdown
                            warnings={warnings}
                            onFixWarning={handleFixWarning}
                            onClose={() => setShowWarningsPanel(false)}
                        />
                    )}
                </div>

                {/* Save button - only for report tabs with changes */}
                {activeTab?.isReport && (
                    <div className="flex items-center border-r border-border">
                        <button
                            onClick={handleSaveClick}
                            disabled={!canSave}
                            className="flex items-center justify-center h-10 w-10 rounded hover:bg-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title={
                                !canSave
                                    ? "No changes to save"
                                    : "Save changes to report"
                            }
                        >
                            <Save className="h-5 w-5 text-blue-500" />
                        </button>
                    </div>
                )}

                {/* Tabs */}
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
                                            className={cn(
                                                "h-8 px-3 rounded-none min-w-0 group-hover:bg-accent/50",
                                                activeTabId === tab.id &&
                                                    "bg-accent/50"
                                            )}
                                            onClick={() => setActiveTab(tab.id)}
                                            onDoubleClick={() =>
                                                handleDoubleClick(tab)
                                            }
                                        >
                                            <span className="truncate max-w-32">
                                                {tab.title}
                                            </span>
                                            {tab.hasUnsavedChanges && (
                                                <span className="ml-1 text-blue-500">
                                                    •
                                                </span>
                                            )}
                                        </Button>
                                    </ContextMenuTrigger>
                                    <ContextMenuContent>
                                        <ContextMenuItem
                                            onClick={() => setActiveTab(tab.id)}
                                        >
                                            Switch to Tab
                                        </ContextMenuItem>
                                        <ContextMenuItem
                                            onClick={() =>
                                                startEditingTab(tab.id)
                                            }
                                        >
                                            Rename
                                        </ContextMenuItem>
                                        <ContextMenuSeparator />
                                        <ContextMenuItem
                                            onClick={() => closeTab(tab.id)}
                                            disabled={tab.isPinned}
                                        >
                                            Close Tab
                                        </ContextMenuItem>
                                    </ContextMenuContent>
                                </ContextMenu>
                            )}

                            {/* Close button */}
                            {!tab.isPinned && (
                                <button
                                    onClick={() => closeTab(tab.id)}
                                    className="h-8 w-6 flex items-center justify-center hover:bg-accent/50 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* New Tab Button */}
                <div className="flex items-center border-l border-border">
                    <button
                        onClick={handleNewTab}
                        className="flex items-center justify-center h-10 w-10 rounded hover:bg-accent/50 transition-colors"
                        title="New Query Tab"
                    >
                        <Plus className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab && <ReportTab key={activeTab.id} tab={activeTab} />}
            </div>

            <AlertDialog
                open={showSaveConfirm}
                onOpenChange={setShowSaveConfirm}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            save your report changes.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleSaveCancel}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleSaveConfirm}>
                            Save changes
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Variables Dialog */}
            <VariablesDialog
                open={showVariablesDialog}
                onOpenChange={setShowVariablesDialog}
                variables={variables}
                onVariablesChange={setVariables}
            />
        </div>
    );
}

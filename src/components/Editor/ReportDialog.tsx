import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { useExplorerStore } from "@/stores/explorerStore";
import { useEditorStore } from "./store/editorStore";
import type { Tab } from "./store/editorStore";

interface ReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tab: Tab | null;
    onSave: () => void;
}

export function ReportDialog({
    open,
    onOpenChange,
    tab,
    onSave,
}: ReportDialogProps) {
    const { createOrUpdateReport } = useApi();
    const { toast } = useToast();
    const { refreshReports } = useExplorerStore();
    const { addTab, updateTab } = useEditorStore();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when dialog opens/closes or tab changes
    useEffect(() => {
        if (open && tab) {
            if (tab.isReport && tab.reportId) {
                // Existing report - populate with current data
                setName(tab.title.replace("Report: ", ""));
                setDescription(""); // We don't store description in tabs currently
            } else {
                // New report - use tab title as default name, but blank for Console
                const isConsoleTab = tab.title === "Console";
                setName(isConsoleTab ? "" : tab.title);
                setDescription("");
            }
        }
    }, [open, tab]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tab || !name.trim()) return;

        setIsSubmitting(true);
        try {
            const isExistingReport = tab.isReport && tab.reportId;

            // Get the report ID from the API response
            const reportResult = await createOrUpdateReport({
                sql: tab.sql,
                name: name.trim(),
                description: description.trim() || undefined,
                id: tab.isReport ? tab.reportId : undefined,
            });

            if (isExistingReport) {
                // Update existing report - just refresh the explorer
                toast({
                    title: "Report updated",
                    description: "Your report has been updated successfully.",
                });
                refreshReports();
            } else {
                // New report - handle based on tab type
                if (tab.title === "Console") {
                    // Console tab: create new tab with the report
                    addTab(`Report: ${name.trim()}`, tab.sql, {
                        isReport: true,
                        reportId: reportResult.id,
                        hasUnsavedChanges: false,
                    });

                    toast({
                        title: "Report created",
                        description:
                            "Your new report has been created and opened in a new tab.",
                    });
                } else {
                    // Regular tab: convert it to a report tab
                    updateTab(tab.id, {
                        title: `Report: ${name.trim()}`,
                        isReport: true,
                        reportId: reportResult.id,
                        hasUnsavedChanges: false,
                    });

                    toast({
                        title: "Report created",
                        description:
                            "Your tab has been converted to a report tab.",
                    });
                }
            }

            onSave();
            onOpenChange(false);
        } catch (error) {
            toast({
                title: "Save failed",
                description:
                    error instanceof Error
                        ? error.message
                        : "Failed to save report.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isExistingReport = tab?.isReport && tab?.reportId;
    const isConsoleTab = tab?.title === "Console";
    const dialogTitle = isExistingReport
        ? "Update Report"
        : isConsoleTab
        ? "Save Console Query as Report"
        : "Save as New Report";
    const submitText = isExistingReport ? "Update Report" : "Create Report";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{dialogTitle}</DialogTitle>
                    <DialogDescription>
                        {isExistingReport
                            ? "Update the SQL content for this report."
                            : isConsoleTab
                            ? "Save your console query as a new report. This will create a new tab for the report."
                            : "Save your SQL query as a new report for future use."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Report Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter report name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">
                            Description (Optional)
                        </Label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter report description"
                            rows={3}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !name.trim()}
                        >
                            {isSubmitting ? "Saving..." : submitText}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

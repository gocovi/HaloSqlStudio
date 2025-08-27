import {
    useState,
    useCallback,
    useEffect,
    useImperativeHandle,
    forwardRef,
} from "react";
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@/components/ui/resizable";
import { SqlEditor } from "@/components/SqlEditor";
import { ResultsGrid } from "@/components/ResultsGrid";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import type { QueryResult } from "@/services/api/types";
import { useToast } from "@/hooks/use-toast";

interface QueryTabProps {
    initialSql?: string;
    onExecute?: (sql: string) => Promise<QueryResult>;
    onContentChange?: (sql: string) => void;
    onSave?: (sql: string) => void;
    sqlContent?: string;
    onSavingChange?: (isSaving: boolean) => void;
    isReport?: boolean;
    reportId?: string;
    onReportSave?: (reportId: string, sql: string) => Promise<void>;
    originalSql?: string; // For reports, this is the original SQL from the database
    onUnsavedChangesChange?: (hasUnsavedChanges: boolean) => void;
}

export const QueryTab = forwardRef<
    { execute: () => void; save: () => void },
    QueryTabProps
>(
    (
        {
            initialSql,
            onExecute,
            onContentChange,
            onSave,
            sqlContent,
            onSavingChange,
            isReport = false,
            reportId,
            onReportSave,
            originalSql,
            onUnsavedChangesChange,
        },
        ref
    ) => {
        const [result, setResult] = useState<QueryResult | null>(null);
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState<string | null>(null);
        const [showSaveConfirm, setShowSaveConfirm] = useState(false);
        const [pendingSave, setPendingSave] = useState<{
            reportId: string;
            sql: string;
        } | null>(null);
        const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
        const { toast } = useToast();

        // Track unsaved changes by comparing current SQL with original
        useEffect(() => {
            if (isReport && originalSql) {
                setHasUnsavedChanges(sqlContent !== originalSql);
            } else {
                setHasUnsavedChanges(false);
            }
        }, [isReport, originalSql, sqlContent]);

        // Notify parent when unsaved changes state changes
        useEffect(() => {
            if (onUnsavedChangesChange) {
                onUnsavedChangesChange(hasUnsavedChanges);
            }
        }, [hasUnsavedChanges, onUnsavedChangesChange]);

        // Notify parent when saving state changes
        useEffect(() => {
            if (onSavingChange) {
                onSavingChange(false); // Reset when component mounts
            }
        }, [onSavingChange]);

        // Expose execute method to parent
        useImperativeHandle(
            ref,
            () => ({
                execute: () => {
                    if (onExecute && sqlContent) {
                        handleExecute(sqlContent);
                    }
                },
                save: () => {
                    if (
                        isReport &&
                        reportId &&
                        onReportSave &&
                        hasUnsavedChanges
                    ) {
                        handleReportSave(sqlContent || "");
                    }
                },
            }),
            [
                onExecute,
                sqlContent,
                isReport,
                reportId,
                onReportSave,
                hasUnsavedChanges,
            ]
        );

        const handleExecute = async (sql: string) => {
            if (!onExecute) return;

            setLoading(true);
            setError(null);

            try {
                const startTime = Date.now();
                const queryResult = await onExecute(sql);
                const executionTime = Date.now() - startTime;

                setResult({
                    ...queryResult,
                    executionTime,
                    rowCount: queryResult.rows.length,
                });
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : "An error occurred"
                );
            } finally {
                setLoading(false);
            }
        };

        // Handle report saving with confirmation
        const handleReportSave = useCallback(
            async (sql: string) => {
                if (!isReport || !reportId || !onReportSave) return;

                setPendingSave({ reportId, sql });
                setShowSaveConfirm(true);
            },
            [isReport, reportId, onReportSave]
        );

        const confirmSave = useCallback(async () => {
            if (!pendingSave || !onReportSave) return;

            try {
                await onReportSave(pendingSave.reportId, pendingSave.sql);
                // Success - the parent component will handle updating the content
                setHasUnsavedChanges(false);
                toast({
                    title: "Report saved",
                    description: "Your report has been saved.",
                });
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : "Failed to save report"
                );
                toast({
                    title: "Save failed",
                    description: "Failed to save report changes.",
                    variant: "destructive",
                });
            } finally {
                setPendingSave(null);
            }
        }, [pendingSave, onReportSave, toast]);

        // Use onSave if provided, otherwise fall back to onContentChange
        const handleSave = onSave || onContentChange;

        return (
            <div className="flex flex-col h-full">
                <ResizablePanelGroup direction="vertical" className="h-full">
                    {/* Editor Section */}
                    <ResizablePanel defaultSize={50} minSize={20}>
                        <SqlEditor
                            initialSql={sqlContent || initialSql}
                            onExecute={handleExecute}
                            onContentChange={onContentChange}
                            onSave={isReport ? handleReportSave : handleSave}
                            onSavingChange={onSavingChange}
                            isReport={isReport}
                            originalSql={originalSql}
                        />
                    </ResizablePanel>

                    {/* Resizable Handle */}
                    <ResizableHandle withHandle />

                    {/* Results Section */}
                    <ResizablePanel defaultSize={50} minSize={20}>
                        <ResultsGrid
                            result={result}
                            loading={loading}
                            error={error}
                        />
                    </ResizablePanel>
                </ResizablePanelGroup>

                {/* Save Confirmation Dialog */}
                <ConfirmDialog
                    open={showSaveConfirm}
                    onOpenChange={setShowSaveConfirm}
                    title="Save Report Changes"
                    description="Are you sure you want to save these changes to the report? This will update the report in the database."
                    confirmText="Save Report"
                    onConfirm={confirmSave}
                />
            </div>
        );
    }
);

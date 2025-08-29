import React, { lazy, Suspense } from "react";
import {
    ResizablePanel,
    ResizablePanelGroup,
    ResizableHandle,
} from "@/components/ui/resizable";
import { SqlEditor } from "../SqlEditor";
import { useEditorStore } from "../store/editorStore";
import type { Tab } from "../store/editorStore";

// Lazy load ResultsGrid to reduce initial bundle size
const ResultsGrid = lazy(() =>
    import("../ResultsGrid").then((module) => ({ default: module.ResultsGrid }))
);

interface ReportTabProps {
    tab: Tab;
}

export const ReportTab: React.FC<ReportTabProps> = ({ tab }) => {
    const { updateTabContent } = useEditorStore();

    const handleContentChange = (sql: string) => {
        updateTabContent(tab.id, sql);
    };

    return (
        <div className="flex flex-col h-full">
            <ResizablePanelGroup direction="vertical" className="h-full">
                {/* Editor Section */}
                <ResizablePanel defaultSize={50} minSize={20}>
                    <SqlEditor
                        sql={tab.sql}
                        onContentChange={handleContentChange}
                        isReport={tab.isReport}
                        originalSql={tab.originalSql}
                    />
                </ResizablePanel>

                {/* Resizable Handle */}
                <ResizableHandle withHandle />

                {/* Results Section */}
                <ResizablePanel defaultSize={50} minSize={20}>
                    <Suspense
                        fallback={
                            <div className="flex items-center justify-center h-full bg-muted/20">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                                    <p className="text-sm text-muted-foreground">
                                        Loading Results Grid...
                                    </p>
                                </div>
                            </div>
                        }
                    >
                        <ResultsGrid
                            result={tab.queryResult || null}
                            loading={tab.isExecuting || false}
                            error={tab.queryError || null}
                        />
                    </Suspense>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
};

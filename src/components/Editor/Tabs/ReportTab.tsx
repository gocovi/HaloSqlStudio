import React from "react";
import {
    ResizablePanel,
    ResizablePanelGroup,
    ResizableHandle,
} from "@/components/ui/resizable";
import { SqlEditor } from "../SqlEditor";
import { ResultsGrid } from "../ResultsGrid";
import { useEditorStore } from "../store/editorStore";
import type { Tab } from "../store/editorStore";

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
                    <ResultsGrid
                        result={tab.queryResult || null}
                        loading={tab.isExecuting || false}
                        error={tab.queryError || null}
                    />
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
};

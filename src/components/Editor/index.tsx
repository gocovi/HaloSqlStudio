import React from "react";
import { Tabs } from "./Tabs";
import { useEditorStore } from "./store/editorStore";

export const Editor: React.FC = () => {
    const { tabs, activeTabId } = useEditorStore();

    return (
        <div className="flex flex-col h-full">
            <Tabs />
            {/* Main content area will be handled by individual tabs */}
        </div>
    );
};

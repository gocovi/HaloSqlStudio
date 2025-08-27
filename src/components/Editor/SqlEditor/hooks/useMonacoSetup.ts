import { useCallback, useEffect } from "react";
import { useTables } from "@/hooks/useTables";
import type { editor } from "monaco-editor";
import * as monaco from "monaco-editor";

export function useMonacoSetup() {
    const { tables } = useTables();

    // Setup Monaco editor with table completion
    const setupMonaco = useCallback((editor: editor.IStandaloneCodeEditor) => {
        // Set theme
        editor.updateOptions({
            theme: "vs-dark",
        });

        // Add keyboard shortcut for save (Ctrl+S)
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            // This will be handled by the parent component
            // We'll dispatch a custom event that the parent can listen to
            editor.trigger("keyboard", "save", {});
        });

        // Add keyboard shortcut for execute (Ctrl+Enter)
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
            editor.trigger("keyboard", "execute", {});
        });
    }, []);

    // Update Monaco completion provider when tables change
    useEffect(() => {
        if (typeof window !== "undefined" && window.monaco) {
            // Update the global tables for Monaco completion
            window.__HALO_TABLES__ = tables;
        }
    }, [tables]);

    return {
        setupMonaco,
    };
}

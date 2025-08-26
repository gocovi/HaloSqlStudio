import { useState, useEffect, useCallback } from "react";
import { useIndexedDB, type QueryRecord } from "./useIndexedDB";

export interface PersistedTab {
    id: string;
    title: string;
    isPinned: boolean;
    sql: string;
    lastModified: number;
}

export interface TabPersistenceState {
    tabs: PersistedTab[];
    activeTabId: string;
}

const MAX_TABS = 50; // Increased limit since we're using IndexedDB

export function useTabPersistence() {
    const { isReady, saveTabsState, loadTabsState, saveQuery } = useIndexedDB();
    const [tabs, setTabs] = useState<QueryRecord[]>([]);
    const [activeTabId, setActiveTabId] = useState<string>("console");
    const [isLoaded, setIsLoaded] = useState(false);
    const [editingTabId, setEditingTabId] = useState<string | null>(null);

    // Load tabs from IndexedDB on mount
    useEffect(() => {
        if (!isReady) return;

        const loadTabs = async () => {
            try {
                const stored = await loadTabsState();

                if (stored && stored.tabs.length > 0) {
                    // Ensure we always have at least a console tab
                    if (!stored.tabs.find((tab) => tab.id === "console")) {
                        const consoleTab: QueryRecord = {
                            id: "console",
                            title: "Console",
                            isPinned: true,
                            sql: "",
                            lastModified: Date.now(),
                            timestamp: Date.now(),
                            isFavorite: false,
                            tags: [],
                        };
                        stored.tabs.unshift(consoleTab);
                    }

                    // Ensure console tab is always pinned
                    const consoleTab = stored.tabs.find(
                        (tab) => tab.id === "console"
                    );
                    if (consoleTab) {
                        consoleTab.isPinned = true;
                    }

                    setTabs(stored.tabs);
                    setActiveTabId(
                        stored.activeTabId || stored.tabs[0]?.id || "console"
                    );
                } else {
                    // Initialize with default console tab
                    const defaultTabs: QueryRecord[] = [
                        {
                            id: "console",
                            title: "Console",
                            isPinned: true,
                            sql: "",
                            lastModified: Date.now(),
                            timestamp: Date.now(),
                            isFavorite: false,
                            tags: [],
                        },
                    ];
                    setTabs(defaultTabs);
                    setActiveTabId("console");
                }
            } catch (error) {
                console.warn("Failed to load tabs from IndexedDB:", error);
                // Fallback to default console tab
                const defaultTabs: QueryRecord[] = [
                    {
                        id: "console",
                        title: "Console",
                        isPinned: true,
                        sql: "",
                        lastModified: Date.now(),
                        timestamp: Date.now(),
                        isFavorite: false,
                        tags: [],
                    },
                ];
                setTabs(defaultTabs);
                setActiveTabId("console");
            } finally {
                setIsLoaded(true);
            }
        };

        loadTabs();
    }, [isReady, loadTabsState]);

    // Save tabs to IndexedDB whenever they change
    const saveTabs = useCallback(
        async (newTabs: QueryRecord[], newActiveTabId: string) => {
            if (!isReady) return;

            try {
                // Limit the number of tabs to prevent issues
                const tabsToSave = newTabs.slice(-MAX_TABS);

                await saveTabsState(tabsToSave, newActiveTabId);
            } catch (error) {
                console.warn("Failed to save tabs to IndexedDB:", error);
            }
        },
        [isReady, saveTabsState]
    );

    // Update tabs and save to IndexedDB
    const updateTabs = useCallback(
        async (newTabs: QueryRecord[], newActiveTabId?: string) => {
            setTabs(newTabs);
            if (newActiveTabId !== undefined) {
                setActiveTabId(newActiveTabId);
            }
            await saveTabs(newTabs, newActiveTabId || activeTabId);
        },
        [activeTabId, saveTabs]
    );

    // Add a new tab
    const addTab = useCallback(
        async (title: string, sql: string = "") => {
            const newTab: QueryRecord = {
                id: `query-${Date.now()}`,
                title,
                isPinned: false,
                sql,
                lastModified: Date.now(),
                timestamp: Date.now(),
                isFavorite: false,
                tags: [],
            };

            const newTabs = [...tabs, newTab];
            await updateTabs(newTabs, newTab.id);
            return newTab.id;
        },
        [tabs, updateTabs]
    );

    // Update a specific tab's content
    const updateTabContent = useCallback(
        async (tabId: string, sql: string) => {
            const newTabs = tabs.map((tab) =>
                tab.id === tabId
                    ? { ...tab, sql, lastModified: Date.now() }
                    : tab
            );
            await updateTabs(newTabs);
        },
        [tabs, updateTabs]
    );

    // Update a tab's title
    const updateTabTitle = useCallback(
        async (tabId: string, title: string) => {
            const newTabs = tabs.map((tab) =>
                tab.id === tabId
                    ? { ...tab, title, lastModified: Date.now() }
                    : tab
            );
            await updateTabs(newTabs);
            setEditingTabId(null); // Exit edit mode
        },
        [tabs, updateTabs]
    );

    // Start editing a tab title
    const startEditingTab = useCallback((tabId: string) => {
        setEditingTabId(tabId);
    }, []);

    // Close a tab
    const closeTab = useCallback(
        async (tabId: string) => {
            // Don't allow closing the console tab
            if (tabId === "console") return;

            const newTabs = tabs.filter((tab) => tab.id !== tabId);
            let newActiveTabId = activeTabId;

            // If we're closing the active tab, switch to another tab
            if (activeTabId === tabId) {
                const remainingTabs = newTabs.filter((tab) => !tab.isPinned);
                if (remainingTabs.length > 0) {
                    newActiveTabId = remainingTabs[remainingTabs.length - 1].id;
                } else {
                    newActiveTabId = "console";
                }
            }

            await updateTabs(newTabs, newActiveTabId);
        },
        [tabs, activeTabId, updateTabs]
    );

    // Set active tab
    const setActiveTab = useCallback(
        async (tabId: string) => {
            setActiveTabId(tabId);
            await saveTabs(tabs, tabId);
        },
        [tabs, saveTabs]
    );

    // Clear all non-pinned tabs
    const clearNonPinnedTabs = useCallback(async () => {
        const pinnedTabs = tabs.filter((tab) => tab.isPinned);
        await updateTabs(pinnedTabs, "console");
    }, [tabs, updateTabs]);

    return {
        tabs,
        activeTabId,
        isLoaded,
        editingTabId,
        addTab,
        updateTabContent,
        updateTabTitle,
        startEditingTab,
        closeTab,
        setActiveTab,
        clearNonPinnedTabs,
        updateTabs,
    };
}

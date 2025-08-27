import { useState, useEffect, useCallback, useRef } from "react";
import { useIndexedDB, type QueryRecord } from "./useIndexedDB";

export interface PersistedTab {
    id: string;
    title: string;
    isPinned: boolean;
    sql: string;
    lastModified: number;
}

export interface TabPersistenceState {
    tabs: QueryRecord[];
    activeTabId: string;
}

const MAX_TABS = 50; // Increased limit since we're using IndexedDB
const SAVE_DEBOUNCE_MS = 2000; // 2 second debounce for autosave

export function useTabPersistence() {
    const { isReady, saveTabsState, loadTabsState, saveQuery } = useIndexedDB();
    const [tabs, setTabs] = useState<QueryRecord[]>([]);
    const [activeTabId, setActiveTabId] = useState<string>("console");
    const [isLoaded, setIsLoaded] = useState(false);
    const [editingTabId, setEditingTabId] = useState<string | null>(null);

    // Debounced save mechanism
    const saveTimeoutRef = useRef<NodeJS.Timeout>();
    const pendingTabsRef = useRef<QueryRecord[]>([]);
    const pendingActiveTabIdRef = useRef<string>("console");

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

                    // Initialize pending refs
                    pendingTabsRef.current = stored.tabs;
                    pendingActiveTabIdRef.current =
                        stored.activeTabId || stored.tabs[0]?.id || "console";
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
                    pendingTabsRef.current = defaultTabs;
                    pendingActiveTabIdRef.current = "console";
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
                pendingTabsRef.current = defaultTabs;
                pendingActiveTabIdRef.current = "console";
            } finally {
                setIsLoaded(true);
            }
        };

        loadTabs();
    }, [isReady, loadTabsState]);

    // Debounced save function
    const debouncedSave = useCallback(async () => {
        if (!isReady) return;

        try {
            // Limit the number of tabs to prevent issues
            const tabsToSave = pendingTabsRef.current.slice(-MAX_TABS);
            await saveTabsState(tabsToSave, pendingActiveTabIdRef.current);
        } catch (error) {
            console.warn("Failed to save tabs to IndexedDB:", error);
        }
    }, [isReady, saveTabsState]);

    // Schedule a save with debouncing
    const scheduleSave = useCallback(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(debouncedSave, SAVE_DEBOUNCE_MS);
    }, [debouncedSave]);

    // Immediate save function (for critical operations)
    const immediateSave = useCallback(async () => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        await debouncedSave();
    }, [debouncedSave]);

    // Update tabs and schedule save
    const updateTabs = useCallback(
        async (newTabs: QueryRecord[], newActiveTabId?: string) => {
            setTabs(newTabs);
            if (newActiveTabId !== undefined) {
                setActiveTabId(newActiveTabId);
            }

            // Update pending refs
            pendingTabsRef.current = newTabs;
            if (newActiveTabId !== undefined) {
                pendingActiveTabIdRef.current = newActiveTabId;
            }

            // Schedule debounced save
            scheduleSave();
        },
        [scheduleSave]
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

    // Update a tab's metadata (including report info)
    const updateTabMetadata = useCallback(
        async (tabId: string, metadata: Partial<QueryRecord>) => {
            const newTabs = tabs.map((tab) =>
                tab.id === tabId
                    ? { ...tab, ...metadata, lastModified: Date.now() }
                    : tab
            );
            await updateTabs(newTabs);
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
            pendingActiveTabIdRef.current = tabId;
            scheduleSave();
        },
        [scheduleSave]
    );

    // Clear all non-pinned tabs
    const clearNonPinnedTabs = useCallback(async () => {
        const pinnedTabs = tabs.filter((tab) => tab.isPinned);
        await updateTabs(pinnedTabs, "console");
    }, [tabs, updateTabs]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    return {
        tabs,
        activeTabId,
        isLoaded,
        editingTabId,
        addTab,
        updateTabContent,
        updateTabTitle,
        updateTabMetadata,
        startEditingTab,
        closeTab,
        setActiveTab,
        clearNonPinnedTabs,
        updateTabs,
        immediateSave, // Expose for manual save operations
    };
}

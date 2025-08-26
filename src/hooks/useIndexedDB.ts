import { useState, useEffect, useCallback } from "react";

export interface QueryRecord {
    id: string;
    title: string;
    sql: string;
    result?: any;
    executionTime?: number;
    timestamp: number;
    lastModified: number;
    isPinned: boolean;
    isFavorite: boolean;
    tags: string[];
    error?: string;
    rowCount?: number;
}

export interface TabState {
    tabs: QueryRecord[];
    activeTabId: string;
}

const DB_NAME = "HaloSQLExplorer";
const DB_VERSION = 1;
const STORE_NAME = "queries";
const TABS_STORE = "tabs";

export function useIndexedDB() {
    const [db, setDb] = useState<IDBDatabase | null>(null);
    const [isReady, setIsReady] = useState(false);

    // Initialize IndexedDB
    useEffect(() => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error("Failed to open IndexedDB:", request.error);
        };

        request.onsuccess = () => {
            setDb(request.result);
            setIsReady(true);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Create queries store
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const queriesStore = db.createObjectStore(STORE_NAME, {
                    keyPath: "id",
                });
                queriesStore.createIndex("timestamp", "timestamp", {
                    unique: false,
                });
                queriesStore.createIndex("isPinned", "isPinned", {
                    unique: false,
                });
                queriesStore.createIndex("isFavorite", "isFavorite", {
                    unique: false,
                });
            }

            // Create tabs store for current state
            if (!db.objectStoreNames.contains(TABS_STORE)) {
                db.createObjectStore(TABS_STORE, { keyPath: "id" });
            }
        };
    }, []);

    // Save query record
    const saveQuery = useCallback(
        async (query: QueryRecord): Promise<void> => {
            if (!db) return;

            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, "readwrite");
                const store = transaction.objectStore(STORE_NAME);

                const putRequest = store.put(query);
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = () => reject(putRequest.error);

                transaction.onerror = () => reject(transaction.error);
            });
        },
        [db]
    );

    // Get all queries
    const getAllQueries = useCallback(async (): Promise<QueryRecord[]> => {
        if (!db) return [];

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, "readonly");
            const store = transaction.objectStore(STORE_NAME);

            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);

            transaction.onerror = () => reject(transaction.error);
        });
    }, [db]);

    // Delete query
    const deleteQuery = useCallback(
        async (id: string): Promise<void> => {
            if (!db) return;

            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, "readwrite");
                const store = transaction.objectStore(STORE_NAME);

                const deleteRequest = store.delete(id);
                deleteRequest.onsuccess = () => resolve();
                deleteRequest.onerror = () => reject(deleteRequest.error);

                transaction.onerror = () => reject(transaction.error);
            });
        },
        [db]
    );

    // Save tabs state
    const saveTabsState = useCallback(
        async (tabs: QueryRecord[], activeTabId: string): Promise<void> => {
            if (!db) return;

            return new Promise((resolve, reject) => {
                const transaction = db.transaction(TABS_STORE, "readwrite");
                const store = transaction.objectStore(TABS_STORE);

                // Clear existing tabs state
                store.clear();

                // Save current state
                const putRequest = store.put({
                    id: "current",
                    tabs,
                    activeTabId,
                });
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = () => reject(putRequest.error);

                transaction.onerror = () => reject(transaction.error);
            });
        },
        [db]
    );

    // Load tabs state
    const loadTabsState = useCallback(async (): Promise<TabState | null> => {
        if (!db) return null;

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(TABS_STORE, "readonly");
            const store = transaction.objectStore(TABS_STORE);

            const request = store.get("current");
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);

            transaction.onerror = () => reject(transaction.error);
        });
    }, [db]);

    // Search queries
    const searchQueries = useCallback(
        async (searchTerm: string): Promise<QueryRecord[]> => {
            const allQueries = await getAllQueries();
            return allQueries.filter(
                (query) =>
                    query.sql
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    query.title
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    query.tags.some((tag) =>
                        tag.toLowerCase().includes(searchTerm.toLowerCase())
                    )
            );
        },
        [getAllQueries]
    );

    // Get favorite queries
    const getFavoriteQueries = useCallback(async (): Promise<QueryRecord[]> => {
        const allQueries = await getAllQueries();
        return allQueries.filter((query) => query.isFavorite);
    }, [getAllQueries]);

    return {
        isReady,
        saveQuery,
        getAllQueries,
        deleteQuery,
        saveTabsState,
        loadTabsState,
        searchQueries,
        getFavoriteQueries,
    };
}

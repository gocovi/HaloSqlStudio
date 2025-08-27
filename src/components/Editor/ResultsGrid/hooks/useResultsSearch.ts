import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import type { QueryResult } from "@/lib/halo-api";

export function useResultsSearch(result: QueryResult, searchTerm: string) {
    const [searchResults, setSearchResults] = useState<
        Array<{ rowIndex: number; colIndex: number; value: string }>
    >([]);
    const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const debounceTimeoutRef = useRef<NodeJS.Timeout>();

    // Immediate search function for Enter key
    const performImmediateSearch = useCallback(
        (term: string) => {
            if (!term.trim()) {
                setSearchResults([]);
                setCurrentSearchIndex(0);
                setIsSearching(false);
                return;
            }

            // Clear any pending debounced search
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }

            setIsSearching(true);

            // Perform search immediately
            const searchLower = term.toLowerCase();
            const results: Array<{
                rowIndex: number;
                colIndex: number;
                value: string;
            }> = [];

            result?.rows?.forEach((row, rowIndex) => {
                result?.columns?.forEach((col, colIndex) => {
                    const value = String(row[col.name] || "");
                    if (value.toLowerCase().includes(searchLower)) {
                        results.push({
                            rowIndex,
                            colIndex,
                            value: String(row[col.name] || ""),
                        });
                    }
                });
            });

            setSearchResults(results);
            setCurrentSearchIndex(0);
            setIsSearching(false);
        },
        [result?.rows, result?.columns]
    );

    // Memoized search results calculation
    const searchResultsMemo = useMemo(() => {
        if (!searchTerm.trim() || !result?.rows || !result?.columns) {
            return [];
        }

        const searchLower = searchTerm.toLowerCase();
        const results: Array<{
            rowIndex: number;
            colIndex: number;
            value: string;
        }> = [];

        // Search through rows and columns
        result.rows.forEach((row, rowIndex) => {
            result.columns.forEach((col, colIndex) => {
                const value = String(row[col.name] || "");
                if (value.toLowerCase().includes(searchLower)) {
                    results.push({
                        rowIndex,
                        colIndex,
                        value: String(row[col.name] || ""),
                    });
                }
            });
        });

        return results;
    }, [searchTerm, result?.rows, result?.columns]);

    // Debounced search effect
    useEffect(() => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            setCurrentSearchIndex(0);
            setIsSearching(false);
            return;
        }

        // Set loading state immediately when search term changes
        setIsSearching(true);

        // Clear any existing timeout
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        // Set a new timeout for debounced search
        debounceTimeoutRef.current = setTimeout(() => {
            setSearchResults(searchResultsMemo);
            setCurrentSearchIndex(0);
            setIsSearching(false);
        }, 400); // 400ms delay for better performance with large datasets

        // Cleanup timeout on unmount
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [searchTerm, searchResultsMemo]);

    const goToNextResult = useCallback(() => {
        if (searchResults.length === 0) return;
        setCurrentSearchIndex((prev) => (prev + 1) % searchResults.length);
    }, [searchResults.length]);

    const goToPrevResult = useCallback(() => {
        if (searchResults.length === 0) return;
        setCurrentSearchIndex(
            (prev) => (prev - 1 + searchResults.length) % searchResults.length
        );
    }, [searchResults.length]);

    // Keyboard navigation for search results
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only handle keyboard navigation when search input is focused
            if (
                !isSearchFocused ||
                !searchTerm.trim() ||
                searchResults.length === 0
            )
                return;

            if (e.key === "Enter" && e.shiftKey) {
                e.preventDefault();
                goToPrevResult();
            } else if (e.key === "Enter") {
                e.preventDefault();
                goToNextResult();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [
        isSearchFocused,
        searchTerm,
        searchResults.length,
        goToNextResult,
        goToPrevResult,
    ]);

    // Keep search results active even when input loses focus
    // Only clear them when search term is empty
    useEffect(() => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            setCurrentSearchIndex(0);
        }
    }, [searchTerm]);

    const clearSearch = useCallback(() => {
        setSearchResults([]);
        setCurrentSearchIndex(0);
    }, []);

    return {
        searchResults,
        currentSearchIndex,
        isSearching,
        isSearchFocused,
        setIsSearchFocused,
        performImmediateSearch,
        goToNextResult,
        goToPrevResult,
        clearSearch,
    };
}

import { useState, useCallback, useEffect, useMemo } from "react";

interface SearchResult {
    rowIndex: number;
    colIndex: number;
    value: string;
}

interface UseSearchOptions {
    data: Record<string, string>[] | null;
    columns: { name: string }[] | null;
    debounceMs?: number;
}

export function useSearch({
    data,
    columns,
    debounceMs = 300,
}: UseSearchOptions) {
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [searchTerm, debounceMs]);

    // Perform search when debounced term changes
    useEffect(() => {
        if (!data || !columns || !debouncedSearchTerm.trim()) {
            setSearchResults([]);
            setCurrentSearchIndex(0);
            return;
        }

        const results: SearchResult[] = [];
        const searchLower = debouncedSearchTerm.toLowerCase();

        data.forEach((row, rowIndex) => {
            columns.forEach((col, colIndex) => {
                const value = String(row[col.name] || "");
                if (value.toLowerCase().includes(searchLower)) {
                    results.push({ rowIndex, colIndex, value });
                }
            });
        });

        setSearchResults(results);
        setCurrentSearchIndex(0);
    }, [data, columns, debouncedSearchTerm]);

    // Memoized filtered rows based on search term
    const filteredRows = useMemo(() => {
        if (!data || !columns || !debouncedSearchTerm.trim()) {
            return data || [];
        }

        return data.filter((row) => {
            return columns.some((col) => {
                const value = String(row[col.name] || "");
                return value
                    .toLowerCase()
                    .includes(debouncedSearchTerm.toLowerCase());
            });
        });
    }, [data, columns, debouncedSearchTerm]);

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

    const clearSearch = useCallback(() => {
        setSearchTerm("");
        setDebouncedSearchTerm("");
        setSearchResults([]);
        setCurrentSearchIndex(0);
    }, []);

    const hasSearchResults = searchResults.length > 0;
    const hasSearchTerm = debouncedSearchTerm.trim().length > 0;

    return {
        // State
        searchTerm,
        debouncedSearchTerm,
        searchResults,
        currentSearchIndex,
        filteredRows,

        // Computed
        hasSearchResults,
        hasSearchTerm,
        totalResults: searchResults.length,
        currentResultNumber: currentSearchIndex + 1,

        // Actions
        setSearchTerm,
        goToNextResult,
        goToPrevResult,
        clearSearch,
    };
}

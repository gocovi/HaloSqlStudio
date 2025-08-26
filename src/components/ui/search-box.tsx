import React, { useRef, useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface SearchBoxProps {
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
    onClear?: () => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onSearch?: (value: string) => void;
    onNavigateUp?: () => void;
    onNavigateDown?: () => void;
    className?: string;
    inputClassName?: string;
    showClearButton?: boolean;
    autoFocus?: boolean;
    disabled?: boolean;
    size?: "sm" | "md" | "lg";
    enableKeyboardShortcut?: boolean;
}

export function SearchBox({
    placeholder = "Search...",
    value = "",
    onChange,
    onClear,
    onKeyDown,
    onSearch,
    onNavigateUp,
    onNavigateDown,
    className,
    inputClassName,
    showClearButton = true,
    autoFocus = false,
    disabled = false,
    size = "md",
    enableKeyboardShortcut = true,
}: SearchBoxProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState(value);
    const [lastSearchedValue, setLastSearchedValue] = useState(value);

    // Only update input value when external value changes (not on every keystroke)
    useEffect(() => {
        setInputValue(value);
        setLastSearchedValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);

        // If onChange is provided, call it (controlled mode)
        // If no onChange, just update local state (uncontrolled mode)
        if (onChange) {
            onChange(newValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();

            // If value has changed, perform search
            if (inputValue !== lastSearchedValue) {
                if (onSearch) {
                    onSearch(inputValue);
                    setLastSearchedValue(inputValue);
                }
            } else {
                // If value hasn't changed, navigate down (or up with Shift)
                if (e.shiftKey && onNavigateUp) {
                    onNavigateUp();
                } else if (onNavigateDown) {
                    onNavigateDown();
                }
            }
        } else if (e.key === "Escape") {
            e.preventDefault();
            handleClear();
        }

        // Call the parent's onKeyDown if provided
        onKeyDown?.(e);
    };

    const handleClear = () => {
        setInputValue("");
        setLastSearchedValue("");
        if (onChange) {
            onChange("");
        }
        onClear?.();
        inputRef.current?.focus();
    };

    // Keyboard shortcut for Ctrl+F
    useEffect(() => {
        if (!enableKeyboardShortcut) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "f") {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [enableKeyboardShortcut]);

    const sizeClasses = {
        sm: "h-6 text-xs",
        md: "h-8 text-sm",
        lg: "h-10 text-base",
    };

    const iconSizes = {
        sm: "h-3 w-3",
        md: "h-4 w-4",
        lg: "h-4 w-4",
    };

    return (
        <div className={cn("relative", className)}>
            <Search
                className={cn(
                    "absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground",
                    iconSizes[size]
                )}
            />
            <Input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                value={inputValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                className={cn("pl-8 pr-8", sizeClasses[size], inputClassName)}
                autoFocus={autoFocus}
                disabled={disabled}
            />
            {showClearButton && inputValue && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className={cn(
                        "absolute right-1 top-1/2 transform -translate-y-1/2 p-0",
                        size === "sm" ? "h-5 w-5" : "h-6 w-6"
                    )}
                    title="Clear search"
                >
                    <X className={iconSizes[size]} />
                </Button>
            )}
        </div>
    );
}

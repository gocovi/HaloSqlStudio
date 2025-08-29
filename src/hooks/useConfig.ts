import { useEffect, useCallback } from "react";
import { useConfigStore } from "@/stores/configStore";

export interface HaloConfig {
    tenant: string;
    authServer: string;
    resourceServer: string;
    clientId: string;
    redirectUri: string;
}

export function useConfig() {
    const {
        config,
        isLoaded,
        isConfigured,
        setConfig,
        resetConfig,
        generateRedirectUri,
        setLoaded,
    } = useConfigStore();

    // Memoize the redirect URI generation to prevent unnecessary re-renders
    const memoizedGenerateRedirectUri = useCallback(() => {
        return generateRedirectUri();
    }, [generateRedirectUri]);

    // Memoize the setConfig function to prevent unnecessary re-renders
    const memoizedSetConfig = useCallback(
        (updates: Partial<HaloConfig>) => {
            setConfig(updates);
        },
        [setConfig]
    );

    // Initialize config on mount if not already loaded
    useEffect(() => {
        if (!isLoaded) {
            // Generate redirect URI if not set
            if (!config.redirectUri) {
                const defaultRedirectUri = memoizedGenerateRedirectUri();
                memoizedSetConfig({ redirectUri: defaultRedirectUri });
            }
            setLoaded(true);
        }
    }, [
        isLoaded,
        config.redirectUri,
        memoizedGenerateRedirectUri,
        memoizedSetConfig,
        setLoaded,
    ]);

    // Save config to store (this will automatically persist to localStorage via Zustand)
    const saveConfig = useCallback(
        (updates: Partial<HaloConfig>) => {
            setConfig(updates);
        },
        [setConfig]
    );

    return {
        config,
        isLoaded,
        isConfigured,
        saveConfig,
        resetConfig,
        generateRedirectUri: memoizedGenerateRedirectUri,
    };
}

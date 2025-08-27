import { useState, useEffect, useCallback } from "react";

export interface HaloConfig {
    authServer: string;
    resourceServer: string;
    clientId: string;
    redirectUri: string;
}

const defaultConfig: HaloConfig = {
    authServer: "",
    resourceServer: "",
    clientId: "",
    redirectUri: "",
};

const CONFIG_STORAGE_KEY = "halo-config";

export function useConfig() {
    const [config, setConfig] = useState<HaloConfig>(defaultConfig);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load config from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
            if (stored) {
                const loadedConfig = {
                    ...defaultConfig,
                    ...JSON.parse(stored),
                };
                setConfig(loadedConfig);
            } else {
                // Initialize with default redirect URI
                const defaultRedirectUri = generateRedirectUri();
                setConfig((prev) => ({
                    ...prev,
                    redirectUri: defaultRedirectUri,
                }));
            }
        } catch (error) {
            console.warn("Failed to read config from localStorage:", error);
            const defaultRedirectUri = generateRedirectUri();
            setConfig((prev) => ({ ...prev, redirectUri: defaultRedirectUri }));
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // Generate redirect URI based on current location
    const generateRedirectUri = useCallback((): string => {
        const baseUrl = window.location.origin;
        return `${baseUrl}/auth/callback`;
    }, []);

    // Save config to localStorage
    const saveConfig = useCallback(
        (updates: Partial<HaloConfig>) => {
            try {
                const updatedConfig = { ...config, ...updates };
                setConfig(updatedConfig);
                localStorage.setItem(
                    CONFIG_STORAGE_KEY,
                    JSON.stringify(updatedConfig)
                );
                return updatedConfig;
            } catch (error) {
                console.warn("Failed to save config to localStorage:", error);
                return config;
            }
        },
        [config]
    );

    // Reset config to defaults
    const resetConfig = useCallback(() => {
        const defaultRedirectUri = generateRedirectUri();
        const resetConfig = {
            ...defaultConfig,
            redirectUri: defaultRedirectUri,
        };
        setConfig(resetConfig);
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(resetConfig));
    }, [generateRedirectUri]);

    return {
        config,
        isLoaded,
        saveConfig,
        resetConfig,
        generateRedirectUri,
    };
}

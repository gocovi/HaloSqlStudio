export interface HaloConfig {
    authServer: string;
    resourceServer: string;
    clientId: string;
    redirectUri: string;
}

export const defaultHaloConfig: HaloConfig = {
    authServer: "",
    resourceServer: "",
    clientId: "",
    redirectUri: "",
};

export const getHaloConfig = (): HaloConfig => {
    try {
        const stored = localStorage.getItem("halo-config");
        if (stored) {
            return { ...defaultHaloConfig, ...JSON.parse(stored) };
        }
        return defaultHaloConfig;
    } catch (error) {
        console.warn("Failed to read config from localStorage:", error);
        return defaultHaloConfig;
    }
};

export const saveHaloConfig = (config: Partial<HaloConfig>) => {
    try {
        const current = getHaloConfig();
        const updated = { ...current, ...config };
        localStorage.setItem("halo-config", JSON.stringify(updated));
        return updated;
    } catch (error) {
        console.warn("Failed to save config to localStorage:", error);
        return config as HaloConfig;
    }
};

// Generate redirect URI based on current location
export const generateRedirectUri = (): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/auth/callback`;
};

// Get the default redirect URI for development
export const getDefaultRedirectUri = (): string => {
    // Check if we're in development mode
    if (
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
    ) {
        // Use the current port instead of hardcoding 5173
        return `${window.location.origin}/auth/callback`;
    }
    return generateRedirectUri();
};

// Initialize config with current redirect URI if not set
export const initializeConfig = (): HaloConfig => {
    try {
        const config = getHaloConfig();
        if (!config.redirectUri) {
            config.redirectUri = getDefaultRedirectUri();
            saveHaloConfig(config);
        }
        return config;
    } catch (error) {
        console.warn("Failed to initialize config from localStorage:", error);
        // Return default config if localStorage is not available
        return {
            authServer: "",
            resourceServer: "",
            clientId: "",
            redirectUri: getDefaultRedirectUri(),
        };
    }
};

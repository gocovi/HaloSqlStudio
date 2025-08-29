import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface HaloConfig {
    tenant: string;
    authServer: string;
    resourceServer: string;
    clientId: string;
    redirectUri: string;
}

const defaultConfig: HaloConfig = {
    tenant: "",
    authServer: "",
    resourceServer: "",
    clientId: "",
    redirectUri: "",
};

interface ConfigState {
    config: HaloConfig;
    isLoaded: boolean;
    isConfigured: boolean;
    setConfig: (updates: Partial<HaloConfig>) => void;
    resetConfig: () => void;
    setLoaded: (loaded: boolean) => void;
    generateRedirectUri: () => string;
}

export const useConfigStore = create<ConfigState>()(
    persist(
        (set, get) => ({
            config: defaultConfig,
            isLoaded: false,
            isConfigured: false,

            setConfig: (updates) => {
                set((state) => {
                    const newConfig = { ...state.config, ...updates };
                    const isConfigured = Boolean(
                        newConfig.clientId &&
                            newConfig.clientId.trim() !== "" &&
                            newConfig.authServer &&
                            newConfig.authServer.trim() !== "" &&
                            newConfig.resourceServer &&
                            newConfig.resourceServer.trim() !== ""
                    );

                    return {
                        config: newConfig,
                        isConfigured,
                    };
                });
            },

            resetConfig: () => {
                const defaultRedirectUri = get().generateRedirectUri();
                set({
                    config: {
                        ...defaultConfig,
                        redirectUri: defaultRedirectUri,
                    },
                    isConfigured: false,
                });
            },

            setLoaded: (loaded) => {
                set({ isLoaded: loaded });
            },

            generateRedirectUri: () => {
                const baseUrl =
                    typeof window !== "undefined" ? window.location.origin : "";
                return `${baseUrl}/auth/callback`;
            },
        }),
        {
            name: "halo-config",
            partialize: (state) => ({ config: state.config }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    // Generate redirect URI on rehydration
                    const defaultRedirectUri = state.generateRedirectUri();
                    if (!state.config.redirectUri) {
                        state.config.redirectUri = defaultRedirectUri;
                    }

                    // Check if config is complete
                    const isConfigured = Boolean(
                        state.config.clientId &&
                            state.config.clientId.trim() !== "" &&
                            state.config.authServer &&
                            state.config.authServer.trim() !== "" &&
                            state.config.resourceServer &&
                            state.config.resourceServer.trim() !== ""
                    );

                    state.isConfigured = isConfigured;
                    state.setLoaded(true);
                }
            },
        }
    )
);

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import { haloAuthService, HaloUser } from "@/lib/halo-auth";
import {
    getHaloConfig,
    saveHaloConfig,
    initializeConfig,
    HaloConfig,
} from "@/lib/halo-config";

interface AuthContextType {
    isAuthenticated: boolean;
    user: HaloUser | null;
    config: HaloConfig;
    login: () => Promise<void>;
    logout: () => void;
    updateConfig: (config: Partial<HaloConfig>) => void;
    refreshAuth: () => void;
    handleAuthError: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<HaloUser | null>(null);
    const [config, setConfig] = useState<HaloConfig>(initializeConfig());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check authentication status on mount
        const checkAuth = () => {
            const authenticated = haloAuthService.isAuthenticated();

            setIsAuthenticated(authenticated);
            if (authenticated) {
                setUser(haloAuthService.getCurrentUser());
            }
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    const login = async () => {
        setIsLoading(true);
        try {
            await haloAuthService.startAuth();
        } catch (error) {
            console.error("Login error:", error);
            setIsLoading(false);
        }
    };

    const logout = () => {
        haloAuthService.logout();
        setIsAuthenticated(false);
        setUser(null);
    };

    const updateConfig = (newConfig: Partial<HaloConfig>) => {
        const updated = { ...config, ...newConfig };
        saveHaloConfig(updated);
        setConfig(updated);
    };

    const refreshAuth = () => {
        const authenticated = haloAuthService.isAuthenticated();
        console.log(
            "AuthContext: refreshAuth called, isAuthenticated:",
            authenticated
        );
        setIsAuthenticated(authenticated);
        if (authenticated) {
            setUser(haloAuthService.getCurrentUser());
        }
    };

    const handleAuthError = () => {
        console.error("Authentication error detected. Logging out.");
        logout();
    };

    const value: AuthContextType = {
        isAuthenticated,
        user,
        config,
        login,
        logout,
        updateConfig,
        refreshAuth,
        handleAuthError,
        isLoading,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};

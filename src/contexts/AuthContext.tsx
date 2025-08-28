import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
    useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import type { HaloUser } from "@/services/auth/types";
import * as authService from "@/services/auth/authService";
import { useConfig } from "@/hooks/useConfig";

interface AuthContextType {
    isAuthenticated: boolean;
    user: HaloUser | null;
    isLoading: boolean;
    startAuth: () => Promise<void>;
    logout: () => void;
    handleCallback: (code: string) => Promise<boolean>;
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
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const { config, isLoaded } = useConfig();

    // Check authentication status when config is loaded
    useEffect(() => {
        if (!isLoaded) return;

        const checkAuth = () => {
            const authenticated = authService.isAuthenticated();
            setIsAuthenticated(authenticated);

            if (authenticated) {
                const currentUser = authService.getCurrentUser();
                setUser(currentUser);
            } else {
                setUser(null);
            }

            setIsLoading(false);
        };

        checkAuth();
    }, [isLoaded]);

    const startAuth = async () => {
        try {
            authService.startAuth({
                authServer: config.authServer,
                clientId: config.clientId,
                redirectUri: config.redirectUri,
            });
        } catch (error) {
            console.error("Failed to start auth:", error);
            throw error;
        }
    };

    const handleCallback = useCallback(
        async (code: string): Promise<boolean> => {
            try {
                setIsLoading(true);

                const success = await authService.handleCallback(
                    {
                        authServer: config.authServer,
                        clientId: config.clientId,
                        redirectUri: config.redirectUri,
                    },
                    code
                );

                if (success) {
                    // Re-check authentication status
                    const authenticated = authService.isAuthenticated();
                    setIsAuthenticated(authenticated);

                    if (authenticated) {
                        const currentUser = authService.getCurrentUser();
                        setUser(currentUser);
                    }
                }

                setIsLoading(false);
                return success;
            } catch (error) {
                console.error("Failed to handle auth callback:", error);
                setIsLoading(false);
                return false;
            }
        },
        [config.authServer, config.clientId, config.redirectUri]
    );

    const logout = () => {
        authService.logout();
        setUser(null);
        setIsAuthenticated(false);
        navigate("/login");
    };

    const value: AuthContextType = {
        isAuthenticated,
        user,
        isLoading,
        startAuth,
        logout,
        handleCallback,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    // Add error boundary for HMR timing issues
    try {
        const { isAuthenticated, isLoading } = useAuth();

        // Show loading spinner while checking authentication
        if (isLoading) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-background">
                    <div className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                        <h1 className="text-2xl font-semibold mb-2">
                            Loading...
                        </h1>
                        <p className="text-muted-foreground">
                            Checking authentication...
                        </p>
                    </div>
                </div>
            );
        }

        // Redirect to login if not authenticated
        if (!isAuthenticated) {
            return <Navigate to="/login" replace />;
        }

        // Render protected content if authenticated
        return <>{children}</>;
    } catch (error) {
        // Handle HMR timing issues gracefully
        console.warn(
            "ProtectedRoute: Context not ready, showing loading state:",
            error
        );
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                    <h1 className="text-2xl font-semibold mb-2">Loading...</h1>
                    <p className="text-muted-foreground">
                        Initializing application...
                    </p>
                </div>
            </div>
        );
    }
};

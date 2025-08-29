import React from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ConfigDialog } from "@/components/ConfigDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useConfig } from "@/hooks/useConfig";
import { Database, Shield, Zap } from "lucide-react";

const Login: React.FC = () => {
    const { startAuth, isLoading, isAuthenticated } = useAuth();
    const { config, isLoaded, isConfigured } = useConfig();

    // Redirect to main app if already authenticated
    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    const handleLogin = async () => {
        if (!config.clientId) {
            alert("Please configure your Client ID first");
            return;
        }
        await startAuth();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex items-center justify-center">
                        <svg
                            width="48"
                            height="48"
                            viewBox="0 0 500 500"
                            className="text-primary"
                        >
                            <g transform="matrix(1.54321,0,0,1.54321,-98.7654,-89.5062)">
                                <path
                                    d="M226,58C315.41,58 388,130.59 388,220C388,309.41 315.41,382 226,382C136.59,382 64,309.41 64,220C64,130.59 136.59,58 226,58ZM147.357,273.917L132.282,319.144L176.723,304.33C191.044,313.721 207.928,319.144 226,319.144C277.724,319.144 319.718,274.719 319.718,220C319.718,165.281 277.724,120.856 226,120.856C174.276,120.856 132.282,165.281 132.282,220C132.282,239.876 137.822,258.393 147.357,273.917Z"
                                    style={{ fill: "currentColor" }}
                                />
                            </g>
                        </svg>
                    </div>
                    <CardTitle className="text-2xl">Halo SQL Studio</CardTitle>
                    <CardDescription>
                        Connect to your Halo PSA instance and explore data with
                        SQL queries
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <h3 className="font-medium">Features</h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Secure OAuth authentication
                            </div>
                            <div className="flex items-center gap-2">
                                <Database className="h-4 w-4" />
                                Execute SQL queries
                            </div>
                            <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                Browse tables and columns
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <ConfigDialog />

                        {isLoaded && isConfigured && (
                            <Button
                                onClick={handleLogin}
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading
                                    ? "Connecting..."
                                    : "Login with HaloPSA"}
                            </Button>
                        )}
                    </div>

                    {!isConfigured && (
                        <div className="text-sm text-muted-foreground text-center">
                            Please configure your Halo settings before
                            connecting
                        </div>
                    )}

                    <div className="text-xs text-muted-foreground text-center pt-4 border-t">
                        <p>
                            You'll need to create an OAuth application in your
                            Halo instance
                        </p>
                        <p>and configure the settings above to get started.</p>
                        <p className="mt-2 font-medium">
                            💡 The Redirect URI is automatically generated - use
                            that value in your Halo OAuth app configuration.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Login;

import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import * as authService from "@/services/auth/authService";

const AuthCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const processCallback = async () => {
            const code = searchParams.get("code");
            const error = searchParams.get("error");

            if (error) {
                console.error("OAuth error:", error);
                navigate("/login?error=" + encodeURIComponent(error), {
                    replace: true,
                });
                return;
            }

            if (!code) {
                console.error("No authorization code received");
                navigate("/login?error=no_code", { replace: true });
                return;
            }

            try {
                // Get config directly from localStorage - no React state dependencies
                const stored = localStorage.getItem("halo-config");
                if (!stored) {
                    console.error("No configuration found");
                    navigate("/login?error=no_config", { replace: true });
                    return;
                }

                const config = JSON.parse(stored);

                // Call authService directly with the config
                const success = await authService.handleCallback(config, code);
                if (success) {
                    // Redirect to main app on success
                    navigate("/", { replace: true });
                } else {
                    // Redirect to login on failure
                    navigate("/login?error=auth_failed", { replace: true });
                }
            } catch (error) {
                console.error("Authentication failed:", error);
                navigate("/login?error=auth_failed", { replace: true });
            }
        };

        // Only process once
        processCallback();
    }, []); // Empty dependency array - only runs once

    // Show loading while processing
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                <h1 className="text-2xl font-semibold mb-2">
                    Completing Authentication
                </h1>
                <p className="text-muted-foreground">
                    Please wait while we complete your login...
                </p>
            </div>
        </div>
    );
};

export default AuthCallback;

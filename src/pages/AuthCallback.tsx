import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { haloAuthService } from "@/lib/halo-auth";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

const AuthCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { refreshAuth, isAuthenticated } = useAuth();
    const [status, setStatus] = useState<"loading" | "success" | "error">(
        "loading"
    );
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [shouldRedirect, setShouldRedirect] = useState(false);

    useEffect(() => {
        // If already authenticated, set redirect flag
        if (isAuthenticated) {
            setShouldRedirect(true);
            return;
        }

        const handleCallback = async () => {
            const code = searchParams.get("code");
            const error = searchParams.get("error");

            if (error) {
                setStatus("error");
                setErrorMessage(error);
                return;
            }

            if (!code) {
                setStatus("error");
                setErrorMessage("No authorization code received");
                return;
            }

            try {
                const success = await haloAuthService.handleCallback(code);
                if (success) {
                    setStatus("success");
                    // Refresh authentication state and redirect
                    refreshAuth();
                    setTimeout(() => {
                        navigate("/", { replace: true });
                    }, 2000);
                } else {
                    setStatus("error");
                    setErrorMessage("Failed to complete authentication");
                }
            } catch (error) {
                setStatus("error");
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "Authentication failed"
                );
            }
        };

        handleCallback();
    }, [searchParams, navigate, isAuthenticated, refreshAuth]);

    // Handle redirect after authentication
    useEffect(() => {
        if (shouldRedirect) {
            navigate("/", { replace: true });
        }
    }, [shouldRedirect, navigate]);

    const handleRetry = () => {
        navigate("/", { replace: true });
    };

    // If already authenticated, show loading while redirecting
    if (shouldRedirect) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                    <h1 className="text-2xl font-semibold mb-2">
                        Redirecting...
                    </h1>
                    <p className="text-muted-foreground">
                        You are already authenticated, redirecting to the main
                        application...
                    </p>
                </div>
            </div>
        );
    }

    if (status === "loading") {
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
    }

    if (status === "success") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-semibold mb-2">
                        Authentication Successful!
                    </h1>
                    <p className="text-muted-foreground mb-4">
                        You will be redirected to the main application shortly.
                    </p>
                    <Button onClick={() => navigate("/", { replace: true })}>
                        Continue Now
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center max-w-md">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-semibold mb-2">
                    Authentication Failed
                </h1>
                <Alert className="mb-4">
                    <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
                <div className="space-x-2">
                    <Button onClick={handleRetry} variant="outline">
                        Try Again
                    </Button>
                    <Button onClick={() => navigate("/", { replace: true })}>
                        Go Back
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AuthCallback;

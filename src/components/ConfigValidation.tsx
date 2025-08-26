import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, TestTube } from "lucide-react";
import { HaloConfig } from "@/lib/halo-config";

interface ValidationResult {
    isValid: boolean;
    message: string;
    details?: string;
}

interface ConfigValidationProps {
    config: HaloConfig;
}

export const ConfigValidation: React.FC<ConfigValidationProps> = ({
    config,
}) => {
    const [isValidating, setIsValidating] = useState(false);
    const [validationResult, setValidationResult] =
        useState<ValidationResult | null>(null);

    const validateConfig = async () => {
        setIsValidating(true);
        setValidationResult(null);

        try {
            const errors: string[] = [];

            // Check required fields
            if (!config.authServer) {
                errors.push("Auth Server is required");
            } else if (!config.authServer.startsWith("https://")) {
                errors.push("Auth Server must use HTTPS");
            }

            if (!config.resourceServer) {
                errors.push("Resource Server is required");
            } else if (!config.resourceServer.startsWith("https://")) {
                errors.push("Resource Server must use HTTPS");
            }

            if (!config.clientId) {
                errors.push("Client ID is required");
            }

            if (!config.redirectUri) {
                errors.push("Redirect URI is required");
            }

            if (errors.length > 0) {
                setValidationResult({
                    isValid: false,
                    message: "Configuration validation failed",
                    details: errors.join(", "),
                });
                return;
            }

            // Test connectivity
            try {
                // Test authorization server
                const authResponse = await fetch(
                    `${config.authServer}/.well-known/openid_configuration`
                );
                if (!authResponse.ok) {
                    errors.push("Authorization server is not accessible");
                }
            } catch (e) {
                errors.push("Authorization server is not accessible");
            }

            try {
                // Test resource server (basic connectivity)
                const resourceResponse = await fetch(
                    `${config.resourceServer}/health`,
                    {
                        method: "HEAD",
                    }
                );
                // Don't fail on this - some servers don't have health endpoints
            } catch (e) {
                // This is not critical, just log it
                console.log(
                    "Resource server health check failed (this may be normal)"
                );
            }

            if (errors.length > 0) {
                setValidationResult({
                    isValid: false,
                    message: "Configuration validation failed",
                    details: errors.join(", "),
                });
            } else {
                setValidationResult({
                    isValid: true,
                    message:
                        "Configuration looks valid! You can now try to connect.",
                });
            }
        } catch (error) {
            setValidationResult({
                isValid: false,
                message: "Validation error",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            });
        } finally {
            setIsValidating(false);
        }
    };

    return (
        <div className="space-y-3">
            <Button
                onClick={validateConfig}
                variant="outline"
                size="sm"
                disabled={isValidating}
            >
                <TestTube className="h-4 w-4 mr-2" />
                {isValidating ? "Validating..." : "Validate Configuration"}
            </Button>

            {validationResult && (
                <Alert
                    className={
                        validationResult.isValid
                            ? "border-green-200 bg-green-50"
                            : "border-red-200 bg-red-50"
                    }
                >
                    {validationResult.isValid ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription
                        className={
                            validationResult.isValid
                                ? "text-green-800"
                                : "text-red-800"
                        }
                    >
                        <div className="font-medium">
                            {validationResult.message}
                        </div>
                        {validationResult.details && (
                            <div className="text-sm mt-1 opacity-80">
                                {validationResult.details}
                            </div>
                        )}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
};

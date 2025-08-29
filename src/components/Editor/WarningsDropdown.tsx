import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info, Zap, CheckCircle } from "lucide-react";
import type { WarningResult } from "@/lib/warnings";

interface WarningsDropdownProps {
    warnings: WarningResult[];
    onFixWarning: (warning: WarningResult) => void;
    onClose: () => void;
}

const severityIcons = {
    error: AlertTriangle,
    warning: AlertTriangle,
    info: Info,
};

const severityColors = {
    error: "bg-destructive text-destructive-foreground",
    warning: "bg-yellow-500 text-yellow-900",
    info: "bg-blue-500 text-blue-900",
};

export function WarningsDropdown({
    warnings,
    onFixWarning,
    onClose,
}: WarningsDropdownProps) {
    if (warnings.length === 0) {
        return (
            <div className="absolute top-full right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50">
                <div className="p-4 text-center">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="font-medium">No warnings found!</p>
                    <p className="text-sm text-muted-foreground">
                        Your SQL looks good.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute top-full right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            <div className="p-3 border-b border-border">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Code Warnings</h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-6 w-6 p-0"
                    >
                        ×
                    </Button>
                </div>
            </div>

            <div className="p-3 space-y-2">
                {warnings.map((result, index) => {
                    const Icon = severityIcons[result.warning.severity];
                    const badgeColor = severityColors[result.warning.severity];

                    return (
                        <div
                            key={`${result.warning.id}-${index}`}
                            className="p-3 border border-border rounded-lg bg-muted/20"
                        >
                            <div className="flex items-start gap-3">
                                <Icon
                                    className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                                        result.warning.severity === "error"
                                            ? "text-destructive"
                                            : result.warning.severity ===
                                              "warning"
                                            ? "text-yellow-500"
                                            : "text-blue-500"
                                    }`}
                                />

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-medium text-xs">
                                            {result.warning.title}
                                        </h4>
                                        <div
                                            className={`text-xs px-2 py-1 rounded-full border ${badgeColor} font-semibold`}
                                        >
                                            {result.warning.severity}
                                        </div>
                                    </div>

                                    <p className="text-xs text-muted-foreground mb-2">
                                        {result.warning.description}
                                    </p>

                                    {result.lineNumbers.length > 0 && (
                                        <div className="text-xs text-muted-foreground mb-2">
                                            Lines:{" "}
                                            {result.lineNumbers.join(", ")}
                                        </div>
                                    )}

                                    {result.warning.fix && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onFixWarning(result)}
                                            className="w-full h-7 text-xs"
                                        >
                                            <Zap className="h-3 w-3 mr-1" />
                                            Auto-fix
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, CheckCircle, Info, X, Zap } from "lucide-react";
import type { WarningResult } from "@/lib/warnings";

interface WarningsPanelProps {
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

export function WarningsPanel({
    warnings,
    onFixWarning,
    onClose,
}: WarningsPanelProps) {
    if (warnings.length === 0) {
        return (
            <div className="w-80 h-full border-l border-border bg-card flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="font-semibold">Code Warnings</h3>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                        <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                        <p>No warnings found!</p>
                        <p className="text-sm">Your SQL looks good.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-80 h-full border-l border-border bg-card flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold">Code Warnings</h3>
                <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                    {warnings.map((result, index) => {
                        const Icon = severityIcons[result.warning.severity];
                        const badgeColor =
                            severityColors[result.warning.severity];

                        return (
                            <div
                                key={`${result.warning.id}-${index}`}
                                className="p-3 border border-border rounded-lg bg-muted/20"
                            >
                                <div className="flex items-start gap-3">
                                    <Icon
                                        className={`h-5 w-5 mt-0.5 ${
                                            result.warning.severity === "error"
                                                ? "text-destructive"
                                                : result.warning.severity ===
                                                  "warning"
                                                ? "text-yellow-500"
                                                : "text-blue-500"
                                        }`}
                                    />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h4 className="font-medium text-sm">
                                                {result.warning.title}
                                            </h4>
                                            <Badge
                                                className={`text-xs ${badgeColor}`}
                                            >
                                                {result.warning.severity}
                                            </Badge>
                                        </div>

                                        <p className="text-sm text-muted-foreground mb-2">
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
                                                onClick={() =>
                                                    onFixWarning(result)
                                                }
                                                className="w-full"
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
            </ScrollArea>
        </div>
    );
}

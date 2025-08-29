import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Settings,
    Save,
    Eye,
    EyeOff,
    CheckCircle,
    RotateCcw,
} from "lucide-react";
import { useConfig } from "@/hooks/useConfig";
import type { HaloConfig } from "@/hooks/useConfig";

export const ConfigDialog: React.FC = () => {
    const { config, isConfigured, saveConfig, resetConfig } = useConfig();
    const [isOpen, setIsOpen] = useState(false);
    const [localConfig, setLocalConfig] = useState<HaloConfig>(config);
    const [showClientSecret, setShowClientSecret] = useState(false);

    // Update localConfig when config changes
    useEffect(() => {
        setLocalConfig(config);
    }, [config]);

    const handleSave = () => {
        saveConfig(localConfig);
        setIsOpen(false);
    };

    const handleCancel = () => {
        setLocalConfig(config);
        setIsOpen(false);
    };

    const handleReset = () => {
        resetConfig();
        setLocalConfig({
            authServer: "",
            resourceServer: "",
            clientId: "",
            redirectUri: config.redirectUri, // Keep the auto-generated redirect URI
        });
    };

    const handleInputChange = (field: keyof HaloConfig, value: string) => {
        setLocalConfig((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full h-12 px-3"
                    title="Configure"
                >
                    <Settings className="h-4 w-4 mr-2" />
                    {isConfigured && (
                        <CheckCircle className="h-4 w-4 ml-2 text-green-600" />
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Halo Configuration</DialogTitle>
                    {isConfigured && (
                        <div className="text-sm text-green-600 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Configuration complete! You can now log in.
                        </div>
                    )}
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="authServer" className="text-right">
                            Auth Server
                        </Label>
                        <Input
                            id="authServer"
                            value={localConfig.authServer}
                            onChange={(e) =>
                                handleInputChange("authServer", e.target.value)
                            }
                            placeholder="https://mymsp.halopsa.com/auth"
                            className="col-span-3"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="resourceServer" className="text-right">
                            Resource Server
                        </Label>
                        <Input
                            id="resourceServer"
                            value={localConfig.resourceServer}
                            onChange={(e) =>
                                handleInputChange(
                                    "resourceServer",
                                    e.target.value
                                )
                            }
                            placeholder="https://mymsp.halopsa.com"
                            className="col-span-3"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="clientId" className="text-right">
                            Client ID
                        </Label>
                        <div className="col-span-3 flex gap-2">
                            <Input
                                id="clientId"
                                type={showClientSecret ? "text" : "password"}
                                value={localConfig.clientId}
                                onChange={(e) =>
                                    handleInputChange(
                                        "clientId",
                                        e.target.value
                                    )
                                }
                                placeholder="Your OAuth client ID"
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setShowClientSecret(!showClientSecret)
                                }
                            >
                                {showClientSecret ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="redirectUri" className="text-right">
                            Redirect URI
                        </Label>
                        <Input
                            id="redirectUri"
                            value={localConfig.redirectUri}
                            readOnly
                            className="col-span-3 bg-muted"
                        />
                        <div className="col-span-3 col-start-2 text-xs text-muted-foreground mt-1">
                            This is automatically generated. Use this value when
                            setting up your OAuth application in Halo.
                        </div>
                    </div>

                    <div className="text-center pt-2">
                        <button
                            type="button"
                            onClick={handleReset}
                            className="text-sm text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 mx-auto"
                        >
                            <RotateCcw className="h-3 w-3" />
                            Reset to defaults
                        </button>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

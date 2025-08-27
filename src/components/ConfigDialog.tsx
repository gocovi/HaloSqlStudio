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
import { Settings, Save, Eye, EyeOff } from "lucide-react";
import { ConfigValidation } from "./ConfigValidation";
import { useConfig } from "@/hooks/useConfig";
import type { HaloConfig } from "@/hooks/useConfig";

export const ConfigDialog: React.FC = () => {
    const { config, saveConfig } = useConfig();
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
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Halo Configuration</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
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
                            placeholder="https://gocovi.halopsa.com/auth"
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
                            placeholder="https://gocovi.halopsa.com"
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
                </div>

                <div className="border-t pt-4">
                    <ConfigValidation config={localConfig} />
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

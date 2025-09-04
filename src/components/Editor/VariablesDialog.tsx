import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Variable } from "lucide-react";

interface VariablesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    variables: Record<string, string>;
    onVariablesChange: (variables: Record<string, string>) => void;
}

export function VariablesDialog({
    open,
    onOpenChange,
    variables,
    onVariablesChange,
}: VariablesDialogProps) {
    const [localVariables, setLocalVariables] =
        useState<Record<string, string>>(variables);

    // Update local state when props change
    useEffect(() => {
        setLocalVariables(variables);
    }, [variables]);

    const handleVariableChange = (key: string, value: string) => {
        setLocalVariables((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleSave = () => {
        onVariablesChange(localVariables);
        onOpenChange(false);
    };

    const handleCancel = () => {
        setLocalVariables(variables); // Reset to original values
        onOpenChange(false);
    };

    const handleReset = () => {
        const defaultVariables = {
            $agentid: "",
            $siteid: "",
            $clientid: "",
            "@startdate": "",
            "@enddate": "",
        };
        setLocalVariables(defaultVariables);
        onVariablesChange(defaultVariables);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Variable className="h-5 w-5" />
                        Halo Variables
                    </DialogTitle>
                    <DialogDescription>
                        Override variables for testing purposes. When in
                        production or left blank, live variables will be used.
                        See{" "}
                        <a
                            href="https://support.haloservicedesk.com/portal/kb?text=%24clientid&entity=articles&id=1449"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Halo's documentation
                        </a>{" "}
                        for more information.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="agentid">$agentid</Label>
                        <div className="relative">
                            <Input
                                id="agentid"
                                value={localVariables.$agentid || ""}
                                onChange={(e) =>
                                    handleVariableChange(
                                        "$agentid",
                                        e.target.value
                                    )
                                }
                                placeholder="Enter agent ID"
                                className={
                                    localVariables.$agentid
                                        ? "border-green-500"
                                        : ""
                                }
                            />
                            {localVariables.$agentid && (
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="siteid">$siteid</Label>
                        <div className="relative">
                            <Input
                                id="siteid"
                                value={localVariables.$siteid || ""}
                                onChange={(e) =>
                                    handleVariableChange(
                                        "$siteid",
                                        e.target.value
                                    )
                                }
                                placeholder="Enter site ID"
                                className={
                                    localVariables.$siteid
                                        ? "border-green-500"
                                        : ""
                                }
                            />
                            {localVariables.$siteid && (
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="clientid">$clientid</Label>
                        <div className="relative">
                            <Input
                                id="clientid"
                                value={localVariables.$clientid || ""}
                                className={
                                    localVariables.$clientid
                                        ? "border-green-500"
                                        : ""
                                }
                                onChange={(e) =>
                                    handleVariableChange(
                                        "$clientid",
                                        e.target.value
                                    )
                                }
                                placeholder="Enter client ID"
                            />
                            {localVariables.$clientid && (
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="startdate">@startdate</Label>
                        <div className="relative">
                            <Input
                                id="startdate"
                                type="date"
                                value={localVariables["@startdate"] || ""}
                                onChange={(e) =>
                                    handleVariableChange(
                                        "@startdate",
                                        e.target.value
                                    )
                                }
                                className={
                                    localVariables["@startdate"]
                                        ? "border-green-500"
                                        : ""
                                }
                            />
                            {localVariables["@startdate"] && (
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="enddate">@enddate</Label>
                        <div className="relative">
                            <Input
                                id="enddate"
                                type="date"
                                value={localVariables["@enddate"] || ""}
                                onChange={(e) =>
                                    handleVariableChange(
                                        "@enddate",
                                        e.target.value
                                    )
                                }
                                className={
                                    localVariables["@enddate"]
                                        ? "border-green-500"
                                        : ""
                                }
                            />
                            {localVariables["@enddate"] && (
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex justify-between">
                    <Button variant="outline" onClick={handleReset}>
                        Reset to Default
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>Save Variables</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

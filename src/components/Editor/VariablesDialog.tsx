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
                        Set values for Halo variables that will be replaced in
                        your SQL queries before execution. Leave empty to use
                        the logged-in user's values. Variables are replaced
                        globally in your SQL before sending to the API.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="agentid" className="text-right">
                            $agentid
                        </Label>
                        <div className="col-span-3 relative">
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

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="siteid" className="text-right">
                            $siteid
                        </Label>
                        <div className="col-span-3 relative">
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

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="clientid" className="text-right">
                            $clientid
                        </Label>
                        <div className="col-span-3 relative">
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
                </div>

                {/* Help text */}
                <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-md">
                    <p>
                        <strong>How it works:</strong>
                    </p>
                    <p>
                        • When you execute a query, any variables you set here
                        will replace the corresponding $agentid, $siteid, or
                        $clientid in your SQL
                    </p>
                    <p>
                        • If you leave a variable empty, it will use the
                        logged-in user's value from the API
                    </p>
                    <p>
                        • This allows you to test the same SQL script with
                        different parameters
                    </p>
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

import type { CodeWarning, WarningResult, WarningRegistry } from "./types";

class WarningRegistryImpl implements WarningRegistry {
    private _warnings: CodeWarning[] = [];

    get warnings(): CodeWarning[] {
        return [...this._warnings];
    }

    register(warning: CodeWarning): void {
        // Remove existing warning with same ID if it exists
        this.unregister(warning.id);
        this._warnings.push(warning);
    }

    unregister(id: string): void {
        this._warnings = this._warnings.filter((w) => w.id !== id);
    }

    scan(sql: string): WarningResult[] {
        const results: WarningResult[] = [];

        for (const warning of this._warnings) {
            if (warning.test(sql)) {
                const lineNumbers = this.findLineNumbers(sql, warning);
                results.push({
                    warning,
                    lineNumbers,
                    context: warning.context,
                });
            }
        }

        return results;
    }

    private findLineNumbers(sql: string, warning: CodeWarning): number[] {
        const lines = sql.split("\n");
        const lineNumbers: number[] = [];

        // This is a simple implementation - specific warnings can override this
        // For now, we'll just check if the warning pattern exists in each line
        lines.forEach((line, index) => {
            if (warning.test(line)) {
                lineNumbers.push(index + 1); // Monaco uses 1-based line numbers
            }
        });

        return lineNumbers;
    }
}

// Export singleton instance
export const warningRegistry = new WarningRegistryImpl();

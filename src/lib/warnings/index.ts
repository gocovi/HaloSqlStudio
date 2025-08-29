export * from "./types";
export * from "./registry";
export * from "./sql-comments";
export * from "./view-incompatible-sql-enhanced";

// Register all warnings
import { warningRegistry } from "./registry";
import { sqlCommentWarning } from "./sql-comments";
import { viewIncompatibleSqlWarning } from "./view-incompatible-sql-enhanced";

// Auto-register warnings
warningRegistry.register(sqlCommentWarning);
warningRegistry.register(viewIncompatibleSqlWarning);

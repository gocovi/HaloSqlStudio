import type { CodeWarning } from "./types";

export const sqlCommentWarning: CodeWarning = {
    id: "sql-comment-syntax",
    title: "Unsupported Comment Syntax",
    description:
        'Halo PSA does not support "--" single-line comments. Use "/* */" block comments instead.',
    severity: "warning",
    category: "compatibility",

    test: (sql: string): boolean => {
        // Check for -- comments that are not inside strings
        const lines = sql.split("\n");

        for (const line of lines) {
            // Simple regex to find -- comments (ignoring quoted strings for now)
            if (line.includes("--")) {
                // Check if it's not inside a quoted string
                const commentIndex = line.indexOf("--");
                const beforeComment = line.substring(0, commentIndex);

                // Count quotes before the comment
                const singleQuotes = (beforeComment.match(/'/g) || []).length;
                const doubleQuotes = (beforeComment.match(/"/g) || []).length;

                // If odd number of quotes, we're inside a string
                if (singleQuotes % 2 === 0 && doubleQuotes % 2 === 0) {
                    return true;
                }
            }
        }

        return false;
    },

    fix: (sql: string): string => {
        const lines = sql.split("\n");
        const fixedLines: string[] = [];

        for (const line of lines) {
            if (line.includes("--")) {
                const commentIndex = line.indexOf("--");
                const beforeComment = line.substring(0, commentIndex);
                const commentText = line.substring(commentIndex + 2).trim();

                // Count quotes before the comment
                const singleQuotes = (beforeComment.match(/'/g) || []).length;
                const doubleQuotes = (beforeComment.match(/"/g) || []).length;

                // If odd number of quotes, we're inside a string, don't modify
                if (singleQuotes % 2 === 1 || doubleQuotes % 2 === 1) {
                    fixedLines.push(line);
                } else {
                    // Replace -- comment with /* */ comment
                    if (commentText) {
                        fixedLines.push(`${beforeComment}/* ${commentText} */`);
                    } else {
                        fixedLines.push(beforeComment);
                    }
                }
            } else {
                fixedLines.push(line);
            }
        }

        return fixedLines.join("\n");
    },
};

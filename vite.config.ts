import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    server: {
        host: "::",
        port: 8080,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(
        Boolean
    ),
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        // Increase chunk size warning limit to avoid noise
        chunkSizeWarningLimit: 1000,
        // Enable minification and tree shaking
        minify: "esbuild",
        // Enable source maps for debugging (disable in production for smaller bundles)
        sourcemap: mode === "development",
        rollupOptions: {
            output: {
                // Manual chunking to separate heavy dependencies
                manualChunks: {
                    // Separate Monaco Editor (very heavy)
                    monaco: ["@monaco-editor/react"],
                    // Separate AG Grid (heavy data grid)
                    agGrid: ["ag-grid-community", "ag-grid-react"],
                    // Separate UI component libraries
                    ui: [
                        "@radix-ui/react-alert-dialog",
                        "@radix-ui/react-context-menu",
                        "@radix-ui/react-dialog",
                        "@radix-ui/react-label",
                        "@radix-ui/react-slot",
                        "@radix-ui/react-toast",
                        "@radix-ui/react-tooltip",
                    ],
                    // Separate state management
                    state: ["zustand"],
                    // Separate utilities
                    utils: [
                        "clsx",
                        "class-variance-authority",
                        "tailwind-merge",
                        "lucide-react",
                    ],
                },
            },
        },
    },
}));

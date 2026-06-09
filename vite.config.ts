import { defineConfig, UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path"; // Use 'node:path' for clarity with Node.js built-ins
import { fileURLToPath } from "node:url"; // Helper to convert file URL to path

// Recreate __dirname for ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (async (): Promise<UserConfig> => {
  const backendPort = process.env.PORT || "5000";

  const plugins = [
    react(),
  ];

  return defineConfig({
    plugins,
    resolve: {
      alias: {
        // Now __dirname is correctly defined for ESM
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
    },
    root: path.resolve(__dirname, "client"),
    build: {
      outDir: path.resolve(__dirname, "dist/public"), // This assumes vite.config.ts is in the project root
      emptyOutDir: true,
    },
    server: {
      // When running the Vite dev server standalone (e.g. `npm run client`),
      // proxy API calls to the Express backend (port 5000).
      proxy: {
        "/api": {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
        },
      },
    }
  });
})();

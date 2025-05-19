import { defineConfig, UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path"; // Use 'node:path' for clarity with Node.js built-ins
import { fileURLToPath } from "node:url"; // Helper to convert file URL to path

// Recreate __dirname for ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (async (): Promise<UserConfig> => {
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
      // This is important for the Vite dev server when used as middleware
      // It ensures that Vite serves assets correctly relative to the Express app.
      // The port here is Vite's dev server port, not your Express server port.
      // Your Express server (e.g., on port 5000) will proxy to this.
      // origin: 'http://localhost:5173', // Or whatever port Vite uses if run standalone
    }
  });
})();

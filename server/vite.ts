import express, { type Express } from "express";
import rateLimit from "express-rate-limit";
import fs from "node:fs"; // Using node: prefix for clarity
import path from "node:path"; // Using node: prefix
import { fileURLToPath } from "node:url"; // Helper to convert file URL to path
import { createServer as createViteServer, createLogger, UserConfig } from "vite";
import { type Server } from "node:http"; // Using node: prefix
// Assuming viteConfig is the UserConfig object or a Promise resolving to it
// If viteConfig is from the previously modified vite.config.ts, it's a Promise.
import viteConfigPromise from "../vite.config";
import { nanoid } from "nanoid";

// Recreate __filename and __dirname for ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  // Resolve the viteConfig promise if it is one
  const resolvedViteConfig = typeof viteConfigPromise === 'function'
    ? await (viteConfigPromise as () => Promise<UserConfig>)()
    : await viteConfigPromise;

  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as true,
  };

  const vite = await createViteServer({
    ...(resolvedViteConfig as UserConfig), // Spread the resolved config
    configFile: false, // We are providing the config programmatically
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        log(`Vite error: ${msg}. Exiting.`, "vite");
        process.exit(1); // Consider if exiting is too aggressive for all errors
      },
    },
    server: serverOptions,
    appType: "custom", // Important for middleware mode
  });

  app.use(vite.middlewares);

  // Configure rate limiter: maximum of 100 requests per 15 minutes
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "Too many requests, please try again later.",
  });

  // Apply rate limiter to the route
  app.use("*", limiter, async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // __dirname is now correctly defined for ESM.
      // This path assumes server/vite.ts is in the 'server' directory,
      // and 'client' is a sibling to 'server'.
      const clientTemplate = path.resolve(
        __dirname,       // Points to the 'server' directory
        "..",            // Moves up to the project root
        "client",
        "index.html",
      );

      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e: any) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
  log("Vite dev server middleware configured.", "vite");
}

export function serveStatic(app: Express) {
  // __dirname is now correctly defined for ESM.
  // This path assumes server/vite.ts is in the 'server' directory,
  // and 'dist/public' is relative to the project root.
  const distPath = path.resolve(
    __dirname,       // Points to the 'server' directory
    "..",            // Moves up to the project root
    "dist",
    "public"
  );

  if (!fs.existsSync(distPath)) {
    const errorMessage = `Static build directory not found at: ${distPath}. Client must be built first.`;
    log(errorMessage, "express");
    throw new Error(errorMessage);
  }

  app.use(express.static(distPath));
  log(`Serving static files from ${distPath}`, "express");

  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

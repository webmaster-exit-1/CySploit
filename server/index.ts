import express, { type NextFunction, type Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import { registerRoutes } from "./routes.js";
import { registerShodanRoutes } from "./routes/shodanRoutes.js";
import { registerMetasploitRoutes } from "./routes/metasploitRoutes.js";
import { setupVite, serveStatic, log } from "./vite.js";

const app = express();

// Security headers middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Required for Vite dev mode and A-Frame
      styleSrc: ["'self'", "'unsafe-inline'"], // Required for inline styles
      imgSrc: ["'self'", "data:", "https:", "http:"], // Allow external images
      connectSrc: ["'self'", "ws:", "wss:", "https:", "http:"], // WebSocket and API connections
      frameSrc: ["'self'"], // Allow same-origin iframes
      fontSrc: ["'self'", "data:"], // Allow fonts
      objectSrc: ["'none'"], // Disable plugins
      mediaSrc: ["'self'"],
      workerSrc: ["'self'", "blob:"], // Required for web workers
      childSrc: ["'self'", "blob:"], // Required for web workers
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      baseUri: ["'self'"],
      manifestSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Disable for external resources
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow cross-origin resources
}));

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['http://localhost:5000'] // In production, only allow same origin
    : ['http://localhost:5000', 'http://localhost:5173'], // In development, allow Vite dev server
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Guard against malformed percent-encoding in URLs.
// Vite's middleware calls decodeURI() and will throw on malformed inputs.
app.use((req, res, next) => {
  try {
    // eslint-disable-next-line no-unused-expressions
    decodeURI(req.url);
    next();
  } catch {
    res.status(400).send('Bad Request');
  }
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, unknown> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  registerShodanRoutes(app);
  registerMetasploitRoutes(app);

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    void _next;
    const record = (typeof err === 'object' && err !== null)
      ? (err as Record<string, unknown>)
      : undefined;
    const status =
      (typeof record?.status === 'number' && record.status) ||
      (typeof record?.statusCode === 'number' && record.statusCode) ||
      500;
    const message = (typeof record?.message === 'string' && record.message) || "Internal Server Error";

    res.status(status).json({ message });
    // Do not rethrow after responding; keep the server process alive.
    log(`Error ${status}: ${message}`, "express");
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();

import express from "express";
import fs from "node:fs";
import type { RequestHandler } from "express";
import cors from "cors";
import helmet, { type HelmetOptions } from "helmet";
import { env } from "./config/env.js";
import { apiRouter } from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./utils/http.js";

const helmetMiddleware = helmet as unknown as (
  options?: Readonly<HelmetOptions>
) => RequestHandler;

export function createApp() {
  const app = express();

  app.set("trust proxy", env.trustProxy);
  app.disable("x-powered-by");

  app.use(
    helmetMiddleware({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use("/api", apiRouter);
  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.get("/ready", (_req, res) => {
    try {
      fs.accessSync(env.storageRoot, fs.constants.R_OK | fs.constants.W_OK);
      res.json({ ok: true });
    } catch {
      res.status(503).json({ ok: false });
    }
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

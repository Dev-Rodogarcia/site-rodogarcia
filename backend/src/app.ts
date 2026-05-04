import express from "express";
import type { RequestHandler } from "express";
import cookieParser from "cookie-parser";
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

  app.set("trust proxy", 1);
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
  app.use(express.json({ limit: "8mb" }));
  app.use(cookieParser());
  app.use("/uploads", express.static(env.uploadsDir, { fallthrough: true }));
  app.use("/api", apiRouter);
  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

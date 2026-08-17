import express, { type RequestHandler } from "express";
import helmet from "helmet";
import { createLanding, getPublishedLanding, listLandings, setLandingStatus, updateLanding } from "./landingService.js";

const token = process.env.LANDING_BUILDER_SERVICE_TOKEN?.trim() ?? "";

const requireService: RequestHandler = (req, res, next) => {
  const provided = req.header("x-landing-builder-service-token") ?? "";
  if (!token || !provided || provided.length !== token.length || !Buffer.from(provided).equals(Buffer.from(token))) {
    res.status(401).json({ error: "Integração de serviço não autorizada." });
    return;
  }
  next();
};

function respond(res: express.Response, callback: () => unknown, status = 200) {
  try { res.status(status).json(callback()); } catch (error) {
    res.status(422).json({ error: error instanceof Error ? error.message : "Não foi possível salvar a landing page." });
  }
}

function param(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] ?? "" : value ?? ""; }

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.get("/api/public/landings/:slug", (req, res) => {
    const landing = getPublishedLanding(param(req.params.slug));
    if (!landing) { res.status(404).json({ error: "Landing page não publicada." }); return; }
    res.json({ landing });
  });

  app.get("/api/internal/landings", requireService, (_req, res) => respond(res, () => ({ landings: listLandings() })));
  app.post("/api/internal/landings", requireService, (req, res) => respond(res, () => ({ landing: createLanding(req.body) }), 201));
  app.put("/api/internal/landings/:id", requireService, (req, res) => respond(res, () => ({ landing: updateLanding(param(req.params.id), req.body) })));
  app.post("/api/internal/landings/:id/publish", requireService, (req, res) => respond(res, () => ({ landing: setLandingStatus(param(req.params.id), "published") })));
  app.post("/api/internal/landings/:id/unpublish", requireService, (req, res) => respond(res, () => ({ landing: setLandingStatus(param(req.params.id), "unpublished") })));
  return app;
}

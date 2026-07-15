import type { RequestHandler } from "express";
import { userRepository } from "../repositories/userRepository.js";
import { isPasswordChangeRequired, publicUser } from "../services/authService.js";
import { getSession, SESSION_COOKIE } from "./session.js";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        session: import("../types/auth.js").Session;
        user: import("../types/auth.js").UserRecord;
      };
    }
  }
}

export const requireAdmin: RequestHandler = (req, res, next) => {
  const sid = req.cookies?.[SESSION_COOKIE];
  if (!sid || typeof sid !== "string") {
    res.status(401).json({ error: "Nao autenticado." });
    return;
  }

  const session = getSession(sid);
  if (!session) {
    res.status(401).json({ error: "Sessão expirada." });
    return;
  }

  const user = userRepository.findById(session.userId);
  if (!user || user.active === false || user.role !== "admin") {
    res.status(403).json({ error: "Acesso administrativo obrigatório." });
    return;
  }
  if (isPasswordChangeRequired(user)) {
    res.status(403).json({ error: "Troque sua senha antes de acessar o painel." });
    return;
  }

  req.auth = { session, user };
  next();
};

export const requireAuthenticated: RequestHandler = (req, res, next) => {
  const sid = req.cookies?.[SESSION_COOKIE];
  if (!sid || typeof sid !== "string") {
    res.status(401).json({ error: "Nao autenticado." });
    return;
  }
  const session = getSession(sid);
  const user = session ? userRepository.findById(session.userId) : null;
  if (!session || !user || user.active === false) {
    res.status(401).json({ error: "Sessão expirada." });
    return;
  }
  req.auth = { session, user };
  next();
};

export const optionalSession: RequestHandler = (req, _res, next) => {
  const sid = req.cookies?.[SESSION_COOKIE];
  if (sid && typeof sid === "string") {
    const session = getSession(sid);
    const user = session ? userRepository.findById(session.userId) : null;
    if (session && user && user.active !== false) {
      req.auth = { session, user };
    }
  }
  next();
};

export function sessionPayload(req: Parameters<RequestHandler>[0]) {
  if (!req.auth) return null;
  return {
    authenticated: true,
    user: publicUser(req.auth.user),
    csrfToken: req.auth.session.csrfToken,
    expiresAt: req.auth.session.expiresAt,
    setupRequired: !userRepository.hasAny(),
  };
}

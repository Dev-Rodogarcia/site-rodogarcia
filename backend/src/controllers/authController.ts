import type { RequestHandler } from "express";
import { userRepository } from "../repositories/userRepository.js";
import {
  createInitialUser,
  changeOwnPassword,
  hasAnyUser,
  login,
  publicUser,
  requestPasswordReset,
  updateOwnCmsTheme,
} from "../services/authService.js";
import { clearSessionCookie, destroySession, setSessionCookie, SESSION_COOKIE } from "../security/session.js";
import { asyncHandler, HttpError } from "../utils/http.js";

export const loginController: RequestHandler = asyncHandler((req, res) => {
  const { user, session } = login(req);
  setSessionCookie(res, session);
  res.json({
    message: "Autenticado com sucesso.",
    user: publicUser(user),
    csrfToken: session.csrfToken,
  });
});

export const changePasswordController: RequestHandler = asyncHandler((req, res) => {
  const updated = changeOwnPassword(req.auth!.user, req.body ?? {});
  res.json({ message: "Senha alterada com sucesso.", user: publicUser(updated) });
});

export const updateCmsThemeController: RequestHandler = asyncHandler((req, res) => {
  const updated = updateOwnCmsTheme(req.auth!.user, req.body ?? {});
  res.json({ user: publicUser(updated) });
});

export const requestPasswordResetController: RequestHandler = asyncHandler((req, res) => {
  requestPasswordReset(req.body ?? {});
  res.json({ message: "Se o acesso estiver cadastrado, sua solicitação foi enviada ao administrador." });
});

export const logoutController: RequestHandler = asyncHandler((req, res) => {
  const sid = req.cookies?.[SESSION_COOKIE];
  if (sid && typeof sid === "string") destroySession(sid);
  clearSessionCookie(res);
  res.json({ message: "Sessão encerrada." });
});

export const sessionController: RequestHandler = asyncHandler((req, res) => {
  if (!req.auth) {
    res.json({ authenticated: false, csrfToken: "", setupRequired: !hasAnyUser() });
    return;
  }

  res.json({
    authenticated: true,
    user: publicUser(req.auth.user),
    csrfToken: req.auth.session.csrfToken,
    expiresAt: req.auth.session.expiresAt,
    setupRequired: !hasAnyUser(),
  });
});

export const meController: RequestHandler = asyncHandler((req, res) => {
  if (!req.auth) throw new HttpError(401, "Nao autenticado.");
  res.json({ user: publicUser(req.auth.user) });
});

export const registerController: RequestHandler = asyncHandler((req, res) => {
  const created = createInitialUser(req.body ?? {});
  res.status(201).json({
    message: "Usuário cadastrado com sucesso.",
    user: publicUser(created),
  });
});

export const setupStatusController: RequestHandler = (_req, res) => {
  res.json({ setupRequired: !userRepository.hasAny() });
};

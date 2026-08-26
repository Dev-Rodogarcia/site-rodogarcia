import type { RequestHandler } from "express";

export const requireJson: RequestHandler = (req, res, next) => {
  if (req.is("application/json")) {
    next();
    return;
  }

  res.status(415).json({ error: "Content-Type deve ser application/json." });
};

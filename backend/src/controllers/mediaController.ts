import type { RequestHandler } from "express";
import {
  listAdminImages,
  readMediaSlots,
  replaceAdminImageReferences,
  saveAdminImage,
  saveAdminImageFromBuffer,
  updateMediaSlots,
} from "../services/mediaService.js";
import { asyncHandler } from "../utils/http.js";

export const listImagesController: RequestHandler = asyncHandler((_req, res) => {
  res.json({ images: listAdminImages() });
});

export const uploadImageController: RequestHandler = asyncHandler((req, res) => {
  const body = req.body ?? {};
  const file = req.file;
  const upload = file
    ? saveAdminImageFromBuffer({
        req,
        fileName: file.originalname,
        mimeType: file.mimetype,
        buffer: file.buffer,
      })
    : saveAdminImage(String(body.fileName ?? ""), String(body.dataUrl ?? ""), req);

  return Promise.resolve(upload).then((image) => {
    res.status(201).json({
      message: "Imagem enviada e otimizada com sucesso.",
      image,
      images: listAdminImages(),
    });
  });
});

export const replaceImageReferenceController: RequestHandler = asyncHandler((req, res) => {
  const body = req.body ?? {};
  const result = replaceAdminImageReferences(
    String(body.fromUrl ?? ""),
    String(body.toUrl ?? ""),
    req
  );
  res.json({
    message: "Referencias atualizadas com sucesso.",
    ...result,
    images: listAdminImages(),
  });
});

export const getMediaSlotsController: RequestHandler = asyncHandler((_req, res) => {
  res.json({ slots: readMediaSlots() });
});

export const updateMediaSlotsController: RequestHandler = asyncHandler((req, res) => {
  const slots = updateMediaSlots(req, req.body ?? {});
  res.json({ message: "Slots de midia atualizados.", slots });
});

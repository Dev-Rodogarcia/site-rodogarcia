import type { RequestHandler } from "express";
import {
  deleteAdminMedia,
  listAdminImages,
  readMediaSlots,
  replaceAdminImageReferences,
  saveAdminMediaFromBuffer,
  updateMediaSlots,
} from "../services/mediaService.js";
import { asyncHandler, HttpError } from "../utils/http.js";

export const listImagesController: RequestHandler = asyncHandler((_req, res) => {
  res.json({ images: listAdminImages() });
});

export const uploadImageController: RequestHandler = asyncHandler((req, res) => {
  const files = req.files as
    | Partial<Record<"image" | "media", Express.Multer.File[]>>
    | undefined;
  const file = req.file ?? files?.media?.[0] ?? files?.image?.[0];
  if (!file) throw new HttpError(422, "Selecione uma mídia para upload.");
  const upload = saveAdminMediaFromBuffer({
    req,
    fileName: file.originalname,
    mimeType: file.mimetype,
    buffer: file.buffer,
  });

  return Promise.resolve(upload).then((image) => {
    res.status(201).json({
      message: "Midia enviada com sucesso.",
      image,
      images: listAdminImages(),
    });
  });
});

export const deleteImageController: RequestHandler = asyncHandler((req, res) => {
  const body = req.body ?? {};
  const result = deleteAdminMedia(
    String(body.url ?? ""),
    body.confirmInUse === true,
    req
  );
  res.json({
    message: "Mídia excluída com sucesso.",
    ...result,
    images: listAdminImages(),
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
  res.json({ message: "Slots de mídia atualizados.", slots });
});

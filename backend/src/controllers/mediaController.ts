import type { RequestHandler } from "express";
import {
  listAdminImages,
  readMediaSlots,
  replaceAdminImageReferences,
  saveAdminImage,
  saveAdminMediaFromBuffer,
  updateMediaSlots,
} from "../services/mediaService.js";
import { asyncHandler } from "../utils/http.js";

export const listImagesController: RequestHandler = asyncHandler((_req, res) => {
  res.json({ images: listAdminImages() });
});

export const uploadImageController: RequestHandler = asyncHandler((req, res) => {
  const body = req.body ?? {};
  const files = req.files as
    | Partial<Record<"image" | "media", Express.Multer.File[]>>
    | undefined;
  const file = req.file ?? files?.media?.[0] ?? files?.image?.[0];
  const upload = file
    ? saveAdminMediaFromBuffer({
        req,
        fileName: file.originalname,
        mimeType: file.mimetype,
        buffer: file.buffer,
      })
    : saveAdminImage(String(body.fileName ?? ""), String(body.dataUrl ?? ""), req);

  return Promise.resolve(upload).then((image) => {
    res.status(201).json({
      message: "Midia enviada com sucesso.",
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
  res.json({ message: "Slots de mídia atualizados.", slots });
});

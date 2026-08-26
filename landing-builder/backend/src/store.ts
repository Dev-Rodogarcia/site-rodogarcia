import fs from "node:fs";
import path from "node:path";
import { env } from "./config/env.js";
import type { LandingPage, StoredLandingMedia } from "./types.js";

const storageRoot = env.storageRoot;
const storePath = path.join(storageRoot, "landings.json");
const mediaStorePath = path.join(storageRoot, "media.json");
const mediaRoot = path.join(storageRoot, "media");

function readJsonArray<T>(filePath: string): T[] {
  try {
    const value: unknown = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return Array.isArray(value) ? value as T[] : [];
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return [];
    throw error;
  }
}

function writeJson(filePath: string, value: unknown) {
  fs.mkdirSync(storageRoot, { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify(value, null, 2), "utf8");
  fs.renameSync(temporaryPath, filePath);
}

export function readLandings(): LandingPage[] {
  return readJsonArray<LandingPage>(storePath);
}

export function writeLandings(landings: LandingPage[]) {
  writeJson(storePath, landings);
}

export function readLandingMedia(): StoredLandingMedia[] {
  return readJsonArray<StoredLandingMedia>(mediaStorePath);
}

export function writeLandingMedia(media: StoredLandingMedia[]) {
  writeJson(mediaStorePath, media);
}

export function getLandingMediaRoot() {
  return mediaRoot;
}

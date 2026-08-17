import fs from "node:fs";
import path from "node:path";
import type { LandingPage } from "./types.js";

const storageRoot = path.resolve(process.env.LANDING_BUILDER_STORAGE_ROOT ?? path.join(process.cwd(), "storage"));
const storePath = path.join(storageRoot, "landings.json");

export function readLandings(): LandingPage[] {
  try {
    const value: unknown = JSON.parse(fs.readFileSync(storePath, "utf8"));
    return Array.isArray(value) ? value as LandingPage[] : [];
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return [];
    throw error;
  }
}

export function writeLandings(landings: LandingPage[]) {
  fs.mkdirSync(storageRoot, { recursive: true });
  const temporaryPath = `${storePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify(landings, null, 2), "utf8");
  fs.renameSync(temporaryPath, storePath);
}

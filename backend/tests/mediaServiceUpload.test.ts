import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { createIsolatedBackendEnv } from "./testEnv.js";

describe("mediaService upload processing", () => {
  it("converts uploaded PNG to WebP variants and records metadata", async () => {
    const env = createIsolatedBackendEnv();
    const { saveAdminImageFromBuffer } = await import("../src/services/mediaService.js");
    const buffer = await sharp({
      create: {
        width: 32,
        height: 24,
        channels: 4,
        background: { r: 20, g: 80, b: 160, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const record = await saveAdminImageFromBuffer({
      fileName: "Hero Rodogarcia.png",
      mimeType: "image/png",
      buffer,
    });

    expect(record.url.endsWith(".webp")).toBe(true);
    expect(record.thumbnailUrl.endsWith("-thumb.webp")).toBe(true);
    expect(record.mediumUrl.endsWith("-medium.webp")).toBe(true);
    expect(record.largeUrl.endsWith("-large.webp")).toBe(true);
    expect(record.originalUrl.endsWith(".png")).toBe(true);
    expect(record.optimizedSize).toBeGreaterThan(0);

    for (const url of [record.url, record.thumbnailUrl, record.mediumUrl, record.largeUrl]) {
      const filePath = path.join(env.uploadsDir, url.replace(/^\/uploads\//, ""));
      expect(fs.existsSync(filePath)).toBe(true);
      const metadata = await sharp(filePath).metadata();
      expect(metadata.format).toBe("webp");
    }
  });

  it("rejects MIME spoofing before writing media", async () => {
    createIsolatedBackendEnv();
    const { saveAdminImageFromBuffer } = await import("../src/services/mediaService.js");

    await expect(
      saveAdminImageFromBuffer({
        fileName: "fake.png",
        mimeType: "image/png",
        buffer: Buffer.from("not a png"),
      })
    ).rejects.toThrow("não corresponde");
  });
});

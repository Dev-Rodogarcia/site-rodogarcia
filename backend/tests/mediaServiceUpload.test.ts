import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { createIsolatedBackendEnv } from "./testEnv.js";

const require = createRequire(import.meta.url);
const ffmpegStaticPath = require("ffmpeg-static") as string | null;

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
    expect(record.originalUrl).toBeUndefined();
    expect(record.optimizedSize).toBeGreaterThan(0);

    for (const url of [record.url, record.thumbnailUrl, record.mediumUrl, record.largeUrl]) {
      const filePath = path.join(env.uploadsDir, url.replace(/^\/uploads\//, ""));
      expect(fs.existsSync(filePath)).toBe(true);
      const metadata = await sharp(filePath).metadata();
      expect(metadata.format).toBe("webp");
    }

    expect(
      fs.readdirSync(env.uploadsDir).some((fileName) => fileName.endsWith(".png"))
    ).toBe(false);
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

  it.skipIf(!ffmpegStaticPath || spawnSync(ffmpegStaticPath, ["-version"], { stdio: "ignore" }).status !== 0)(
    "converts uploaded MP4 to WebM without retaining the source file",
    async () => {
      const env = createIsolatedBackendEnv();
      const { saveAdminMediaFromBuffer } = await import("../src/services/mediaService.js");
      const sourcePath = path.join(env.root, "source.mp4");
      const created = spawnSync(
        ffmpegStaticPath!,
        [
          "-y",
          "-f",
          "lavfi",
          "-i",
          "color=c=blue:s=32x24:d=0.2",
          "-f",
          "lavfi",
          "-i",
          "anullsrc=r=48000:cl=stereo",
          "-shortest",
          "-c:v",
          "libx264",
          "-c:a",
          "aac",
          sourcePath,
        ],
        { stdio: "ignore" }
      );
      expect(created.status).toBe(0);

      const record = await saveAdminMediaFromBuffer({
        fileName: "operacao.mp4",
        mimeType: "video/mp4",
        buffer: fs.readFileSync(sourcePath),
      });

      expect(record.url.endsWith(".webm")).toBe(true);
      expect(record.format).toBe("webm");
      expect(fs.existsSync(path.join(env.uploadsDir, record.url.replace(/^\/uploads\//, "")))).toBe(true);
      expect(fs.readdirSync(env.uploadsDir).some((fileName) => fileName.endsWith(".mp4"))).toBe(false);
    }
  );
});

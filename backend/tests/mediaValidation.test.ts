import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createIsolatedBackendEnv } from "./testEnv.js";

describe("mediaValidationService", () => {
  it("accepts only internal known media and rejects external or unsafe references", async () => {
    const env = createIsolatedBackendEnv();
    fs.writeFileSync(path.join(env.uploadsDir, "hero.webp"), "webp");

    const {
      assertInternalMediaUrl,
      sanitizeInternalImageUrl,
    } = await import("../src/services/mediaValidationService.js");

    expect(sanitizeInternalImageUrl("/uploads/hero.webp")).toBe("/uploads/hero.webp");
    expect(() => assertInternalMediaUrl("https://cdn.example.com/hero.webp", { kind: "image" })).toThrow();
    expect(() => assertInternalMediaUrl("data:image/png;base64,AAAA", { kind: "image" })).toThrow();
    expect(() => assertInternalMediaUrl("javascript:alert(1)", { kind: "image" })).toThrow();
    expect(() => assertInternalMediaUrl("/uploads/../private/users.json", { kind: "image" })).toThrow();
    expect(() => assertInternalMediaUrl("/uploads/movie.mp4", { kind: "image" })).toThrow();
  });

  it("accepts media registered in the library store", async () => {
    const env = createIsolatedBackendEnv();
    fs.writeFileSync(
      path.join(env.storageRoot, "media-library.json"),
      JSON.stringify([{ url: "/brand/logo.webp", mediaType: "image" }])
    );

    const { assertInternalMediaUrl } = await import("../src/services/mediaValidationService.js");

    expect(assertInternalMediaUrl("/brand/logo.webp", "image")).toBe("/brand/logo.webp");
  });
});

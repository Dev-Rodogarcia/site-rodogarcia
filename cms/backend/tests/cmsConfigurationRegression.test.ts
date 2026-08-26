import fs from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { createIsolatedBackendEnv } from "./testEnv.js";

const temporaryRoots: string[] = [];

function isolatedBackend() {
  const env = createIsolatedBackendEnv();
  temporaryRoots.push(env.root);
  return env;
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

describe("CMS configuration regressions", () => {
  it("enforces LGPD invariants, known boolean types and the necessary category", async () => {
    isolatedBackend();
    const { consentSettingsRepository } = await import(
      "../src/repositories/jsonRepositories.js"
    );
    const { readConsentSettings, updateConsentSettings } = await import(
      "../src/services/consentService.js"
    );

    consentSettingsRepository.write({
      enabled: "false",
      version: 0,
      behavior: {
        requireExplicitChoice: "false",
        blockAnalyticsUntilConsent: false,
        reopenOnVersionChange: 0,
        unknownRule: true,
      },
      desktop: { position: "bottom-right", compact: "false", unknownRule: true },
      mobile: { position: "side-panel", compact: true, unknownRule: true },
      categories: [
        {
          key: "analytics",
          label: "Analytics principal",
          description: "Medição agregada",
          required: true,
          enabledByDefault: true,
        },
        {
          key: "analytics",
          label: "Duplicada",
          description: "Não deve sobreviver",
        },
      ],
      unknownRoot: "discard-me",
    });

    const stored = readConsentSettings();
    expect(stored).toMatchObject({
      enabled: true,
      version: 1,
      style: "floating",
      behavior: {
        requireExplicitChoice: true,
        blockAnalyticsUntilConsent: true,
        reopenOnVersionChange: true,
      },
      desktop: { position: "bottom-center", compact: true },
      mobile: { position: "bottom-sheet", compact: true },
    });
    expect(stored.categories.map((category) => category.key)).toEqual([
      "necessary",
      "analytics",
    ]);
    expect(stored.categories[0]).toMatchObject({
      key: "necessary",
      required: true,
      enabledByDefault: true,
    });
    expect(stored.categories[1]).toMatchObject({
      key: "analytics",
      required: false,
      enabledByDefault: false,
    });
    expect(stored).not.toHaveProperty("unknownRoot");
    expect(stored.behavior).not.toHaveProperty("unknownRule");

    const updated = updateConsentSettings(undefined, {
      enabled: false,
      behavior: {
        requireExplicitChoice: false,
        blockAnalyticsUntilConsent: false,
        reopenOnVersionChange: false,
      },
      desktop: { position: "bottom-left", compact: false },
      mobile: { position: "center-modal", compact: "false" },
      categories: [
        {
          key: "marketing",
          label: "Marketing",
          description: "Campanhas autorizadas",
          required: true,
          enabledByDefault: true,
        },
      ],
    });

    expect(updated.enabled).toBe(false);
    expect(updated.behavior).toEqual({
      requireExplicitChoice: false,
      blockAnalyticsUntilConsent: true,
      reopenOnVersionChange: false,
    });
    expect(updated.desktop).toEqual({ position: "bottom-center", compact: true });
    expect(updated.mobile).toEqual({ position: "center-modal", compact: true });
    expect(updated.categories[0]).toMatchObject({
      key: "necessary",
      required: true,
      enabledByDefault: true,
    });
    expect(updated.categories[1]).toMatchObject({
      key: "marketing",
      required: false,
      enabledByDefault: false,
    });
  });

  it("preserves valid popup zero values, clamps displays and drops unknown nested keys", async () => {
    isolatedBackend();
    const { popupConfigRepository } = await import(
      "../src/repositories/jsonRepositories.js"
    );
    const { readPopupConfig, updatePopupConfig } = await import(
      "../src/services/popupService.js"
    );

    popupConfigRepository.write({
      delaySeconds: 0,
      cooldownHours: 0,
      maxShowsPerSession: 0,
      desktop: { title: "Desktop armazenado", unknownNested: "discard-me" },
      mobile: { title: "Mobile armazenado", unknownNested: "discard-me" },
      unknownRoot: "discard-me",
    });

    const stored = readPopupConfig();
    expect(stored.delaySeconds).toBe(0);
    expect(stored.cooldownHours).toBe(0);
    expect(stored.maxShowsPerSession).toBe(1);
    expect(stored).not.toHaveProperty("unknownRoot");
    expect(stored.desktop).not.toHaveProperty("unknownNested");
    expect(stored.mobile).not.toHaveProperty("unknownNested");

    const updated = updatePopupConfig({
      delaySeconds: 0,
      cooldownHours: 0,
      maxShowsPerSession: 99,
      desktop: { title: "Desktop editado", unknownNested: "discard-me" },
      mobile: {
        title: "Mobile editado",
        sheetTitle: "Atendimento",
        unknownNested: "discard-me",
      },
      unknownRoot: "discard-me",
    });

    expect(updated.delaySeconds).toBe(0);
    expect(updated.cooldownHours).toBe(0);
    expect(updated.maxShowsPerSession).toBe(10);
    expect(updated).not.toHaveProperty("unknownRoot");
    expect(updated.desktop).toEqual({
      title: "Desktop editado",
      description: expect.any(String),
      image: "",
    });
    expect(updated.mobile).toEqual({
      title: "Mobile editado",
      description: expect.any(String),
      image: "",
      sheetTitle: "Atendimento",
    });
  });

  it("rejects a popup configuration without any contact field", async () => {
    isolatedBackend();
    const { updatePopupConfig } = await import("../src/services/popupService.js");

    expect(() =>
      updatePopupConfig({
        enableName: false,
        enableEmail: false,
        enablePhone: false,
      })
    ).toThrow(/ao menos um campo de contato/i);
  });

  it("returns a safe popup configuration when legacy storage disables every contact field", async () => {
    isolatedBackend();
    const { popupConfigRepository } = await import("../src/repositories/jsonRepositories.js");
    const { readPopupConfig } = await import("../src/services/popupService.js");

    popupConfigRepository.write({
      enableName: false,
      enableEmail: false,
      enablePhone: false,
    });

    expect(readPopupConfig()).toMatchObject({ enableEmail: true });
  });

  it("rejects empty LGPD fields and duplicate category keys instead of restoring old values", async () => {
    isolatedBackend();
    const { updateConsentSettings } = await import("../src/services/consentService.js");

    expect(() => updateConsentSettings(undefined, { title: "" })).toThrow(/title é obrigatório/i);
    expect(() => updateConsentSettings(undefined, { version: 0 })).toThrow(/versão inteira/i);
    expect(() => updateConsentSettings(undefined, {
      categories: [
        { key: "analytics", label: "Analytics", description: "Medição agregada" },
        { key: "analytics", label: "Duplicada", description: "Não deve persistir" },
      ],
    })).toThrow(/chaves das categorias/i);
  });

  it("requires valid provider identifiers before analytics can be enabled", async () => {
    isolatedBackend();
    const { readPublicAnalyticsConfig, updateAnalyticsConfig } = await import(
      "../src/services/analyticsService.js"
    );

    expect(() => updateAnalyticsConfig({
      providers: { ga4: { enabled: true, measurementId: "" } },
    })).toThrow(/Measurement ID GA4 válido/i);
    expect(() => updateAnalyticsConfig({
      providers: { clarity: { enabled: true, projectId: "***" } },
    })).toThrow(/Project ID Microsoft Clarity válido/i);

    updateAnalyticsConfig({
      providers: {
        ga4: { enabled: true, measurementId: "g-abc1234" },
        clarity: { enabled: true, projectId: "abc123def" },
      },
    });
    expect(readPublicAnalyticsConfig()).toMatchObject({
      providers: {
        ga4: { enabled: true, measurementId: "G-ABC1234" },
        clarity: { enabled: true, projectId: "abc123def" },
      },
    });
  });
});

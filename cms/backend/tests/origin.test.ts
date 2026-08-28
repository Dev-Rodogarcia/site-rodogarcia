import { describe, expect, it } from "vitest";
import { isAllowedOrigin } from "../src/security/origin.js";

describe("origens de desenvolvimento", () => {
  it("aceita somente o formato HTTPS temporário do Dev Tunnel", () => {
    expect(isAllowedOrigin("https://chkh822f-35180.brs.devtunnels.ms")).toBe(true);
    expect(isAllowedOrigin("https://chkh822f-35180.devtunnels.ms")).toBe(false);
    expect(isAllowedOrigin("http://chkh822f-35180.brs.devtunnels.ms")).toBe(false);
    expect(isAllowedOrigin("https://example.com")).toBe(false);
  });
});

import { describe, expect, it, vi } from "vitest";
import { requireContentLengthLimit } from "../src/validators/common.js";

describe("request limits", () => {
  it("rejects an oversized declared multipart body before a parser runs", () => {
    const next = vi.fn();
    requireContentLengthLimit(1024)(
      {
        header(name: string) {
          return name.toLowerCase() === "content-length" ? "1025" : undefined;
        },
      } as never,
      {} as never,
      next
    );

    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0]?.[0]).toMatchObject({
      status: 413,
      message: "Arquivo ou payload excede o limite permitido.",
    });
  });

  it("rejects malformed Content-Length instead of forwarding it to Multer", () => {
    const next = vi.fn();
    requireContentLengthLimit(1024)(
      {
        header() {
          return "not-a-number";
        },
      } as never,
      {} as never,
      next
    );

    expect(next.mock.calls[0]?.[0]).toMatchObject({
      status: 400,
      message: "Content-Length inválido.",
    });
  });
});

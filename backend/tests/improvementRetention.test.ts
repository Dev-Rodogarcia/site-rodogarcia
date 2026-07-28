import { beforeEach, describe, expect, it, vi } from "vitest";

let records: Record<string, unknown>[] = [];

vi.mock("../src/repositories/jsonRepositories.js", () => ({
  improvementRepository: {
    read: () => records,
    write: (next: Record<string, unknown>[]) => { records = next; },
  },
}));
vi.mock("../src/services/auditService.js", () => ({ recordAuditAction: vi.fn() }));

const { runImprovementRetention } = await import("../src/services/improvementService.js");

describe("retenção de sugestões de melhoria", () => {
  beforeEach(() => { records = []; });

  it("arquiva uma sugestão concluída há 60 dias", () => {
    records = [{ id: "done", status: "completed", completedAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" }];
    runImprovementRetention(new Date("2026-03-02T00:00:00.000Z"));
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ id: "done", status: "archived", archivedAt: "2026-03-02T00:00:00.000Z" });
  });

  it("exclui uma sugestão arquivada há 60 dias", () => {
    records = [{ id: "old", status: "archived", archivedAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" }];
    runImprovementRetention(new Date("2026-03-02T00:00:00.000Z"));
    expect(records).toHaveLength(0);
  });
});

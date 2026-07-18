import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
}

function configureEslForTest() {
  process.env.GRAPHQL_API_KEY = "test-esl-token";
  process.env.ESL_TENANT = "rodogarcia-test";
  delete process.env.ESL_GRAPHQL_URL;
  vi.resetModules();
}

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

const quotePayload = {
  corporationUnitId: "unit-matriz",
  customerCnpj: "01351335000117",
  senderCnpj: "01351335000117",
  recipientCnpj: "60960473000162",
  origin: { postalCode: "06268000", name: "Osasco", stateCode: "SP" },
  destination: { postalCode: "17123210", name: "Agudos", stateCode: "SP" },
  realWeight: 25000,
  cubicVolume: 25,
  invoiceValue: 250000,
  invoiceVolumes: 150,
  requesterName: "Caio Garcia",
  requesterPhone: "14991943869",
  requesterEmail: "caio@example.com",
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  restoreEnv();
});

describe("EslRequestScheduler", () => {
  it("respeita dois segundos entre o início de chamadas consecutivas", async () => {
    const waits: number[] = [];
    const { EslRequestScheduler } = await import("../src/services/eslGraphqlClient.js");
    const scheduler = new EslRequestScheduler(2_000, () => 1_000, async (milliseconds) => {
      waits.push(milliseconds);
    });

    await Promise.all([scheduler.run(async () => "primeira"), scheduler.run(async () => "segunda")]);

    expect(waits).toEqual([2_000]);
  });
});

describe("integração ESL de cotação e coleta", () => {
  it("envia cotação fracionada ao endpoint privado e devolve o total dos trechos", async () => {
    configureEslForTest();
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        data: {
          quoteCreate: {
            success: true,
            errors: [],
            resource: {
              id: "125",
              sequenceCode: 24,
              referenceNumber: "SITE-123",
              requestedAt: "2026-07-17T12:00:00-03:00",
              quoteStretchBids: [{ total: 824.5 }],
            },
          },
        },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { parseQuoteRequest } = await import("../src/validators/eslTransport.js");
    const { createFractionalQuote } = await import("../src/services/eslTransportService.js");
    const result = await createFractionalQuote(parseQuoteRequest(quotePayload));

    expect(result.price).toEqual({ stretches: [{ total: 824.5 }], total: 824.5 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rodogarcia-test.eslcloud.com.br/graphql");
    expect(options.headers).toMatchObject({ Authorization: "Bearer test-esl-token" });
    const sent = JSON.parse(String(options.body)) as {
      query: string;
      variables: { params: { quoteStretchBidsAttributes: Array<{ calculationType: string }> } };
    };
    expect(sent.query).toContain("quoteStretchBids { total }");
    expect(sent.variables.params.quoteStretchBidsAttributes[0]?.calculationType).toBe(
      "price_table"
    );
  });

  it("valida a NF pelo ESL antes de devolver seu identificador remoto", async () => {
    configureEslForTest();
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        data: {
          invoice: {
            edges: [
              {
                node: {
                  id: "8950942",
                  key: "35250300000000000000000000000000000000000000",
                  number: "456",
                  series: "1",
                  issueDate: "2026-07-17",
                  value: 15000,
                  volume: 3,
                  weight: 100,
                  status: "pending",
                },
              },
            ],
          },
        },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { parseInvoiceLookupRequest } = await import("../src/validators/eslTransport.js");
    const { validateCollectionInvoice } = await import("../src/services/eslTransportService.js");
    const result = await validateCollectionInvoice(
      parseInvoiceLookupRequest({
        invoiceKey: "35250300000000000000000000000000000000000000",
        senderCnpj: "01351335000117",
        recipientCnpj: "60960473000162",
      })
    );

    expect(result.invoice).toMatchObject({ id: "8950942", value: 15000, volume: 3, weight: 100 });
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const sent = JSON.parse(String(options.body)) as { variables: { params: { key: string } } };
    expect(sent.variables.params.key).toBe("35250300000000000000000000000000000000000000");
  });

  it("monta o cancelamento com data definida pelo servidor e motivo canônico", async () => {
    configureEslForTest();
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        data: {
          pickCancellation: {
            success: true,
            errors: [],
            resource: {
              id: "359397",
              sequenceCode: 13925,
              status: "canceled",
              cancellationReason: "Outros: Cliente alterou a programação",
            },
          },
        },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { parseCollectionCancellationRequest } = await import(
      "../src/validators/eslTransport.js"
    );
    const { cancelCollection } = await import("../src/services/eslTransportService.js");
    const result = await cancelCollection(
      "359397",
      parseCollectionCancellationRequest({
        reason: "OUTROS",
        otherReason: "Cliente alterou a programação",
      })
    );

    expect(result.status).toBe("canceled");
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const sent = JSON.parse(String(options.body)) as {
      query: string;
      variables: { id: string; params: { cancellationReason: string; cancellationDatetime: string } };
    };
    expect(sent.query).toContain("pickCancellation");
    expect(sent.variables.id).toBe("359397");
    expect(sent.variables.params.cancellationReason).toBe(
      "Outros: Cliente alterou a programação"
    );
    expect(Date.parse(sent.variables.params.cancellationDatetime)).toBeGreaterThan(0);
  });
});

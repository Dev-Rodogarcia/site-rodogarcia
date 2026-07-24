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
  customerCnpj: "01351335000117",
  senderCnpj: "01351335000117",
  recipientCnpj: "60960473000162",
  origin: { postalCode: "06268000", name: "Osasco", stateCode: "SP" },
  destination: { postalCode: "17123210", name: "Agudos", stateCode: "SP" },
  height: 2,
  width: 2,
  length: 2,
  realWeight: 25000,
  cubicVolume: 25,
  invoiceValue: 250000,
  invoiceVolumes: 150,
  requesterName: "Caio Garcia",
  requesterPhone: "14991943869",
  requesterEmail: "caio@example.com",
};

const collectionPayload = {
  customerCnpj: "01351335000117",
  pickupLocationCnpj: "60960473000162",
  senderCnpj: "",
  recipientCnpj: "",
  origin: { name: "Osasco", stateCode: "SP" },
  serviceDate: "2026-07-24",
  serviceStartHour: "08:00",
  serviceEndHour: "12:00",
  invoiceId: "8950942",
  invoice: {
    invoiceKey: "35250300000000000000000000000000000000000000",
    invoiceNumber: "",
    invoiceSeries: "",
    senderCnpj: "",
    recipientCnpj: "",
  },
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
  it("envia o maior peso entre o real e o taxado pelo volume", async () => {
    configureEslForTest();
    const { quoteWeightForEsl } = await import("../src/services/eslTransportService.js");

    expect(quoteWeightForEsl({ realWeight: 4_700, cubicVolume: 16 })).toBe(4_800);
    expect(quoteWeightForEsl({ realWeight: 5_222, cubicVolume: 16 })).toBe(5_222);
  });

  it("seleciona a tabela de 3 metros quando alguma medida atinge o limite", async () => {
    configureEslForTest();
    const { quotePriceTableForEsl } = await import("../src/services/eslTransportService.js");

    expect(quotePriceTableForEsl({ height: 2.99, width: 2, length: 2 })).toBe("PADRÃO");
    expect(quotePriceTableForEsl({ height: 2, width: 3, length: 2 })).toBe(
      "PADRÃO - 3 METROS"
    );
  });

  it("envia cotação fracionada ao endpoint privado e devolve o total dos trechos", async () => {
    configureEslForTest();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            deliveryRegion: {
              nodes: [
                {
                  deliveryCities: [{ city: { name: "Osasco", state: { code: "SP" } } }],
                  ediDefaultCorporation: { id: "1", person: { cnpj: "60960473000243" } },
                  deliveryRegionCorporations: [
                    { corporation: { id: "1", person: { cnpj: "60960473000243" } } },
                  ],
                },
              ],
              pageInfo: { endCursor: null, hasNextPage: false },
            },
          },
        })
      )
      .mockResolvedValueOnce(
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
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, options] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toBe("https://rodogarcia-test.eslcloud.com.br/graphql");
    expect(options.headers).toMatchObject({ Authorization: "Bearer test-esl-token" });
    const regionLookup = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as { query: string };
    expect(regionLookup.query).toContain("deliveryRegion");
    const sent = JSON.parse(String(options.body)) as {
      query: string;
      variables: {
        params: {
          corporation: { document: string };
          quoteStretchBidsAttributes: Array<{
            calculationType: string;
            realWeight: number;
            customerPriceTable: { name: string };
          }>;
        };
      };
    };
    expect(sent.query).toContain("quoteStretchBids { total }");
    expect(sent.variables.params.quoteStretchBidsAttributes[0]?.calculationType).toBe(
      "price_table"
    );
    expect(sent.variables.params.quoteStretchBidsAttributes[0]?.realWeight).toBe(
      quotePayload.realWeight
    );
    expect(sent.variables.params.quoteStretchBidsAttributes[0]?.customerPriceTable.name).toBe(
      "PADRÃO"
    );
    expect(sent.variables.params.corporation.document).toBe("60960473000243");
  });

  it("usa a filial padrão da região quando a cidade de origem tem mais de uma filial vinculada", async () => {
    configureEslForTest();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            deliveryRegion: {
              nodes: [
                {
                  deliveryCities: [{ city: { name: "Toritama", state: { code: "PE" } } }],
                  ediDefaultCorporation: { id: "rec", person: { cnpj: "60960473000839" } },
                  deliveryRegionCorporations: [
                    { corporation: { id: "agu", person: { cnpj: "60960473001134" } } },
                    { corporation: { id: "rec", person: { cnpj: "60960473000839" } } },
                  ],
                },
              ],
              pageInfo: { endCursor: null, hasNextPage: false },
            },
          },
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            quoteCreate: {
              success: true,
              errors: [],
              resource: { id: "126", quoteStretchBids: [] },
            },
          },
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    const { parseQuoteRequest } = await import("../src/validators/eslTransport.js");
    const { createFractionalQuote } = await import("../src/services/eslTransportService.js");
    await createFractionalQuote(
      parseQuoteRequest({
        ...quotePayload,
        origin: { postalCode: "55125000", name: "Toritama", stateCode: "PE" },
      })
    );

    const sent = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body)) as {
      variables: { params: { corporation: { document: string } } };
    };
    expect(sent.variables.params.corporation.document).toBe("60960473000839");
  });

  it("bloqueia a cotação quando a cidade de origem não está em uma região atendida", async () => {
    configureEslForTest();
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        data: {
          deliveryRegion: {
            nodes: [
              {
                deliveryCities: [{ city: { name: "Agudos", state: { code: "SP" } } }],
                deliveryRegionCorporations: [
                  { corporation: { id: "agu", person: { cnpj: "60960473001134" } } },
                ],
              },
            ],
            pageInfo: { endCursor: null, hasNextPage: false },
          },
        },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { parseQuoteRequest } = await import("../src/validators/eslTransport.js");
    const { createFractionalQuote } = await import("../src/services/eslTransportService.js");
    await expect(
      createFractionalQuote(
        parseQuoteRequest({
          ...quotePayload,
          origin: { postalCode: "01001000", name: "São Paulo", stateCode: "SP" },
        })
      )
    ).rejects.toThrow("Ainda não atendemos a cidade de origem informada");
    expect(fetchMock).toHaveBeenCalledTimes(1);
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
      })
    );

    expect(result.invoice).toMatchObject({ id: "8950942", value: 15000, volume: 3, weight: 100 });
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const sent = JSON.parse(String(options.body)) as {
      variables: { params: { key: string; issuer?: unknown; recipient?: unknown } };
    };
    expect(sent.variables.params.key).toBe("35250300000000000000000000000000000000000000");
    expect(sent.variables.params.issuer).toBeUndefined();
    expect(sent.variables.params.recipient).toBeUndefined();
  });

  it("agenda a coleta com a filial da origem e usa o cliente também como pagador", async () => {
    configureEslForTest();
    const invoice = {
      id: "8950942",
      key: "35250300000000000000000000000000000000000000",
      number: "456",
      series: "1",
      issueDate: "2026-07-17",
      value: 15000,
      volume: 3,
      weight: 100,
      status: "pending",
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            deliveryRegion: {
              nodes: [
                {
                  deliveryCities: [{ city: { name: "Osasco", state: { code: "SP" } } }],
                  deliveryRegionCorporations: [
                    { corporation: { id: "1", person: { cnpj: "60960473000243" } } },
                  ],
                },
              ],
              pageInfo: { endCursor: null, hasNextPage: false },
            },
          },
        })
      )
      .mockResolvedValueOnce(jsonResponse({ data: { invoice: { edges: [{ node: invoice }] } } }))
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            pickCreate: {
              success: true,
              errors: [],
              resource: { id: "359397", sequenceCode: 13925, status: "requested" },
            },
          },
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    const { parseCollectionRequest } = await import("../src/validators/eslTransport.js");
    const { createCollection } = await import("../src/services/eslTransportService.js");
    const result = await createCollection(parseCollectionRequest(collectionPayload));

    expect(result).toMatchObject({ requiresWhatsApp: false, collection: { id: "359397" } });
    const sent = JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body)) as {
      variables: {
        params: {
          corporation: { document: string };
          customer: { document: string };
          pickItemsAttributes: Array<{
            payer: { document: string };
            sender?: unknown;
            recipient?: unknown;
          }>;
        };
      };
    };
    const pickItem = sent.variables.params.pickItemsAttributes[0]!;
    expect(sent.variables.params.corporation.document).toBe("60960473000243");
    expect(sent.variables.params.customer.document).toBe(collectionPayload.customerCnpj);
    expect(pickItem.payer.document).toBe(collectionPayload.customerCnpj);
    expect(pickItem.sender).toBeUndefined();
    expect(pickItem.recipient).toBeUndefined();
  });

  it("agenda a coleta sem consulta da NF e registra o endereço informado nas observações", async () => {
    configureEslForTest();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            deliveryRegion: {
              nodes: [
                {
                  deliveryCities: [{ city: { name: "Osasco", state: { code: "SP" } } }],
                  deliveryRegionCorporations: [
                    { corporation: { id: "1", person: { cnpj: "60960473000243" } } },
                  ],
                },
              ],
              pageInfo: { endCursor: null, hasNextPage: false },
            },
          },
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            pickCreate: {
              success: true,
              errors: [],
              resource: { id: "359398", sequenceCode: 13926, status: "requested" },
            },
          },
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    const { parseCollectionRequest } = await import("../src/validators/eslTransport.js");
    const { createCollection } = await import("../src/services/eslTransportService.js");
    await createCollection(
      parseCollectionRequest({
        ...collectionPayload,
        invoiceId: "",
        invoice: { invoiceKey: "", invoiceNumber: "", invoiceSeries: "", senderCnpj: "", recipientCnpj: "" },
        deliveryAddress: {
          postalCode: "06090000",
          street: "Avenida dos Autonomistas",
          number: "1234",
          complement: "Galpão 2",
          neighborhood: "Vila Yara",
          city: "Osasco",
          stateCode: "SP",
        },
      })
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const sent = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body)) as {
      variables: {
        params: {
          comments: string;
          pickItemsAttributes: Array<{ pickItemInvoicesAttributes?: unknown }>;
        };
      };
    };
    expect(sent.variables.params.comments).toContain("Endereço de entrega informado: Avenida dos Autonomistas, 1234");
    expect(sent.variables.params.pickItemsAttributes[0]?.pickItemInvoicesAttributes).toBeUndefined();
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

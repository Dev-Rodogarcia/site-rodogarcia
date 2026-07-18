import { generateId } from "../utils/ids.js";
import { HttpError } from "../utils/http.js";
import { readContentData } from "./contentService.js";
import {
  type CancellationReason,
  type CollectionCancellationRequest,
  type CollectionRequest,
  type CollectionUpdateRequest,
  type InvoiceLookupRequest,
  type QuoteRequest,
} from "../validators/eslTransport.js";
import { EslGraphqlResponseError, executeEslGraphql } from "./eslGraphqlClient.js";

const QUOTE_CREATE_MUTATION = `
  mutation quoteCreate($params: QuoteCreateInput!) {
    quoteCreate(params: $params) {
      errors
      resource {
        id
        sequenceCode
        referenceNumber
        requestedAt
        effectiveUntil
        requesterName
        requesterPhone
        requesterEmail
        bidsApprovedCount
        bidsDisapprovedCount
        bidsPendingCount
        quoteStretchBids { total }
      }
      success
    }
  }
`;

const INVOICE_QUERY = `
  query invoice($params: InvoiceQueryInput, $first: Int) {
    invoice(params: $params, first: $first) {
      edges {
        node {
          id
          key
          number
          series
          issueDate
          value
          volume
          weight
          status
        }
      }
    }
  }
`;

const PICK_RESOURCE_FIELDS = `
  id
  sequenceCode
  status
  cancellationReason
  comments
  requestDate
  requestHour
  serviceDate
  serviceStartHour
  serviceEndHour
  invoicesValue
  invoicesVolumes
  invoicesWeight
`;

const PICK_CREATE_MUTATION = `
  mutation pickCreate($params: PickMutationInput!) {
    pickCreate(params: $params) {
      errors
      resource { ${PICK_RESOURCE_FIELDS} }
      success
    }
  }
`;

const PICK_UPDATE_MUTATION = `
  mutation pickUpdate($id: ID!, $params: PickMutationInput!) {
    pickUpdate(id: $id, params: $params) {
      errors
      resource { ${PICK_RESOURCE_FIELDS} }
      success
    }
  }
`;

const PICK_CANCELLATION_MUTATION = `
  mutation pickCancellation($id: ID!, $params: PickCancellationInput!) {
    pickCancellation(id: $id, params: $params) {
      errors
      resource { ${PICK_RESOURCE_FIELDS} }
      success
    }
  }
`;

const CANCELLATION_LABELS: Record<CancellationReason, string> = {
  CLIENTE_SOLICITOU: "Cliente solicitou o cancelamento",
  DIVERGENCIA_DE_DADOS: "Divergência nos dados da coleta",
  ENDERECO_INCORRETO: "Endereço de coleta incorreto",
  MERCADORIA_INDISPONIVEL: "Mercadoria indisponível para coleta",
  SOLICITACAO_DUPLICADA: "Solicitação de coleta duplicada",
  OUTROS: "Outros",
};

type EslRecord = Record<string, unknown>;

function quoteCorporationCnpj(unitId: string) {
  const unit = readContentData().units.find((item) => item.id === unitId && item.active !== false);
  const cnpj = String(unit?.quoteCnpj ?? "").replace(/\D/g, "");
  if (!/^\d{14}$/.test(cnpj)) {
    throw new HttpError(422, "A filial selecionada não está disponível para cotação.");
  }
  return cnpj;
}

interface ValidatedInvoice {
  id: string;
  key: string;
  number: string;
  series: string;
  issueDate: string;
  value: number;
  volume: number;
  weight: number;
  status: string;
}

function asRecord(value: unknown): EslRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as EslRecord)
    : null;
}

function asText(value: unknown, maxLength = 120) {
  return typeof value === "string" || typeof value === "number"
    ? String(value).trim().slice(0, maxLength)
    : "";
}

function asNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function operationResult(data: unknown, operationName: string) {
  const result = asRecord(asRecord(data)?.[operationName]);
  if (!result) {
    throw new HttpError(502, "O ESL retornou uma resposta incompleta.");
  }

  const errors = Array.isArray(result.errors)
    ? result.errors.map((value) => asText(value, 300)).filter(Boolean)
    : [];
  if (result.success !== true || errors.length > 0) {
    throw new EslGraphqlResponseError(errors.length > 0 ? errors : ["Operação não concluída."]);
  }

  const resource = asRecord(result.resource);
  if (!resource) throw new HttpError(502, "O ESL não retornou o registro solicitado.");
  return resource;
}

function invoiceFromQuery(data: unknown): ValidatedInvoice {
  const connection = asRecord(asRecord(data)?.invoice);
  const edges = Array.isArray(connection?.edges) ? connection.edges : [];
  const nodes = edges
    .map((edge) => asRecord(asRecord(edge)?.node))
    .filter((node): node is EslRecord => Boolean(node));

  if (nodes.length !== 1) {
    throw new HttpError(422, "Não foi possível confirmar uma única nota fiscal no ESL.");
  }

  const invoice = nodes[0];
  const id = asText(invoice.id, 40);
  if (!/^\d+$/.test(id)) {
    throw new HttpError(422, "A nota fiscal localizada não pode ser usada para agendar a coleta.");
  }

  return {
    id,
    key: asText(invoice.key, 60),
    number: asText(invoice.number, 40),
    series: asText(invoice.series, 20),
    issueDate: asText(invoice.issueDate, 20),
    value: asNumber(invoice.value),
    volume: asNumber(invoice.volume),
    weight: asNumber(invoice.weight),
    status: asText(invoice.status, 40),
  };
}

function formatSaoPaulo(date: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    hourCycle: "h23",
    ...options,
  }).formatToParts(date);
}

function currentSaoPauloDate() {
  const values = formatSaoPaulo(new Date(), { year: "numeric", month: "2-digit", day: "2-digit" });
  const part = (type: Intl.DateTimeFormatPartTypes) => values.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function currentSaoPauloTime() {
  const values = formatSaoPaulo(new Date(), { hour: "2-digit", minute: "2-digit" });
  const part = (type: Intl.DateTimeFormatPartTypes) => values.find((item) => item.type === type)?.value ?? "";
  return `${part("hour")}:${part("minute")}`;
}

function clientError(error: unknown, message: string): never {
  if (error instanceof HttpError) throw error;
  if (error instanceof EslGraphqlResponseError) throw new HttpError(422, message);
  throw error;
}

function customerIsNotRegistered(error: unknown) {
  if (!(error instanceof EslGraphqlResponseError)) return false;
  return error.errors.some(
    (message) =>
      /cliente|customer/i.test(message) &&
      /n[aã]o|not|inv[aá]lid|cadastr|encontr|cadastro/i.test(message)
  );
}

function quoteReference() {
  return `SITE-${generateId("quote").replace("quote_", "").slice(0, 24)}`;
}

function collectionReference(value: string) {
  return value || `SITE-${generateId("pick").replace("pick_", "").slice(0, 24)}`;
}

function buildWhatsappCollectionMessage(input: CollectionRequest) {
  return [
    "Solicitação de coleta pelo site Rodogarcia",
    `Filial: ${input.corporationCnpj}`,
    `Cliente: ${input.customerCnpj}`,
    `Local de coleta: ${input.pickupLocationCnpj}`,
    `Data: ${input.serviceDate}`,
    `Horário: ${input.serviceStartHour} até ${input.serviceEndHour}`,
    `NF: ${input.invoice.invoiceKey || input.invoice.invoiceNumber}`,
  ].join("\n");
}

function buildClosedQuoteWhatsappMessage(input: QuoteRequest) {
  return [
    "Solicitação de cotação de carga fechada pelo site Rodogarcia",
    `Cliente/pagador: ${input.customerCnpj}`,
    "Tabela de preço: PADRÃO",
    `Origem: ${input.origin.name}/${input.origin.stateCode} — CEP ${input.origin.postalCode}`,
    `Destino: ${input.destination.name}/${input.destination.stateCode} — CEP ${input.destination.postalCode}`,
    ...(input.recipientCnpj ? [`Destinatário: ${input.recipientCnpj}`] : []),
    `Peso: ${input.realWeight} kg`,
    `Volume: ${input.cubicVolume} m³`,
    `Valor NF: R$ ${input.invoiceValue}`,
    `Volumes: ${input.invoiceVolumes}`,
    `Solicitante: ${input.requesterName} — ${input.requesterPhone}`,
    `E-mail: ${input.requesterEmail}`,
  ].join("\n");
}

async function resolveInvoice(input: InvoiceLookupRequest) {
  try {
    const data = await executeEslGraphql(INVOICE_QUERY, {
      params: {
        ...(input.invoiceKey ? { key: input.invoiceKey } : { number: input.invoiceNumber }),
        ...(input.invoiceSeries ? { series: input.invoiceSeries } : {}),
        issuer: { document: input.senderCnpj },
        recipient: { document: input.recipientCnpj },
      },
      first: 2,
    });
    return invoiceFromQuery(data);
  } catch (error) {
    clientError(error, "Não foi possível validar a nota fiscal informada.");
  }
}

export async function createFractionalQuote(input: QuoteRequest) {
  const corporationCnpj = quoteCorporationCnpj(input.corporationUnitId);
  try {
    const data = await executeEslGraphql(QUOTE_CREATE_MUTATION, {
      params: {
        corporation: { document: corporationCnpj },
        customer: { document: input.customerCnpj },
        requestedAt: new Date().toISOString(),
        requesterName: input.requesterName,
        requesterPhone: input.requesterPhone,
        requesterEmail: input.requesterEmail,
        referenceNumber: quoteReference(),
        comments: [
          "Cotação solicitada pelo site Rodogarcia.",
          `CEP de origem: ${input.origin.postalCode}.`,
          `CEP de destino: ${input.destination.postalCode}.`,
          input.comments,
        ]
          .filter(Boolean)
          .join(" "),
        quoteStretchBidsAttributes: [
          {
            cubicVolume: input.cubicVolume,
            modal: "rodo",
            realWeight: input.realWeight,
            payer: { document: input.customerCnpj },
            ...(input.senderCnpj ? { sender: { document: input.senderCnpj } } : {}),
            ...(input.recipientCnpj ? { recipient: { document: input.recipientCnpj } } : {}),
            calculationType: "price_table",
            customerPriceTable: { name: "PADRÃO" },
            originCity: { name: input.origin.name, stateCode: input.origin.stateCode },
            destinationCity: { name: input.destination.name, stateCode: input.destination.stateCode },
            productClassification: { name: input.productClassificationName || "Outros" },
            invoicesValue: input.invoiceValue,
            invoicesVolumes: input.invoiceVolumes,
          },
        ],
      },
    });
    const resource = operationResult(data, "quoteCreate");
    const stretches = Array.isArray(resource.quoteStretchBids)
      ? resource.quoteStretchBids
          .map((stretch) => asRecord(stretch))
          .filter((stretch): stretch is EslRecord => Boolean(stretch))
          .map((stretch) => ({ total: asNumber(stretch.total) }))
      : [];
    const total = stretches.length > 0 ? stretches.reduce((sum, stretch) => sum + stretch.total, 0) : null;

    return {
      id: asText(resource.id, 40),
      sequenceCode: asText(resource.sequenceCode, 40),
      referenceNumber: asText(resource.referenceNumber, 100),
      requestedAt: asText(resource.requestedAt, 40),
      price: { stretches, total },
    };
  } catch (error) {
    clientError(error, "Não foi possível calcular a cotação. Confira os dados e tente novamente.");
  }
}

export function prepareClosedQuoteWhatsapp(input: QuoteRequest) {
  quoteCorporationCnpj(input.corporationUnitId);
  return { whatsappMessage: buildClosedQuoteWhatsappMessage(input) };
}

export async function validateCollectionInvoice(input: InvoiceLookupRequest) {
  const invoice = await resolveInvoice(input);
  return { invoice };
}

export async function createCollection(input: CollectionRequest) {
  const invoice = await resolveInvoice(input.invoice);
  if (invoice.id !== input.invoiceId) {
    throw new HttpError(422, "A validação da nota fiscal expirou. Valide a NF novamente.");
  }

  try {
    const data = await executeEslGraphql(PICK_CREATE_MUTATION, {
      params: {
        corporation: { document: input.corporationCnpj },
        requestDate: currentSaoPauloDate(),
        requestHour: currentSaoPauloTime(),
        customer: { document: input.customerCnpj },
        referenceNumber: collectionReference(input.referenceNumber),
        pickupLocation: { document: input.pickupLocationCnpj },
        serviceDate: input.serviceDate,
        serviceStartHour: input.serviceStartHour,
        serviceEndHour: input.serviceEndHour,
        comments: input.comments || undefined,
        pickItemsAttributes: [
          {
            modal: "rodo",
            invoicesValue: invoice.value,
            invoicesVolumes: invoice.volume,
            invoicesRealWeight: invoice.weight,
            recipient: { document: input.recipientCnpj },
            payer: { document: input.payerCnpj },
            sender: { document: input.senderCnpj },
            pickItemInvoicesAttributes: [{ invoiceId: Number(invoice.id) }],
          },
        ],
      },
    });
    const resource = operationResult(data, "pickCreate");
    return {
      requiresWhatsApp: false as const,
      collection: {
        id: asText(resource.id, 40),
        sequenceCode: asText(resource.sequenceCode, 40),
        status: asText(resource.status, 40),
      },
    };
  } catch (error) {
    if (customerIsNotRegistered(error)) {
      return {
        requiresWhatsApp: true as const,
        whatsappMessage: buildWhatsappCollectionMessage(input),
      };
    }
    clientError(error, "Não foi possível agendar a coleta. Confira os dados e tente novamente.");
  }
}

export async function updateCollection(id: string, input: CollectionUpdateRequest) {
  try {
    const data = await executeEslGraphql(PICK_UPDATE_MUTATION, {
      id,
      params: {
        ...(input.serviceDate ? { serviceDate: input.serviceDate } : {}),
        ...(input.serviceStartHour ? { serviceStartHour: input.serviceStartHour } : {}),
        ...(input.serviceEndHour ? { serviceEndHour: input.serviceEndHour } : {}),
        ...(input.comments ? { comments: input.comments } : {}),
      },
    });
    const resource = operationResult(data, "pickUpdate");
    return {
      id: asText(resource.id, 40),
      sequenceCode: asText(resource.sequenceCode, 40),
      status: asText(resource.status, 40),
    };
  } catch (error) {
    clientError(error, "Não foi possível atualizar a coleta. Confira os dados e tente novamente.");
  }
}

export async function cancelCollection(id: string, input: CollectionCancellationRequest) {
  const reason =
    input.reason === "OUTROS"
      ? `${CANCELLATION_LABELS[input.reason]}: ${input.otherReason}`
      : CANCELLATION_LABELS[input.reason];

  try {
    const data = await executeEslGraphql(PICK_CANCELLATION_MUTATION, {
      id,
      params: {
        cancellationReason: reason,
        cancellationDatetime: new Date().toISOString(),
      },
    });
    const resource = operationResult(data, "pickCancellation");
    return {
      id: asText(resource.id, 40),
      sequenceCode: asText(resource.sequenceCode, 40),
      status: asText(resource.status, 40),
      cancellationReason: asText(resource.cancellationReason, 360),
    };
  } catch (error) {
    clientError(error, "Não foi possível cancelar a coleta. Tente novamente mais tarde.");
  }
}

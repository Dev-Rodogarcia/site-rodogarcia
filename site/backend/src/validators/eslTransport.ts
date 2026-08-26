import { z } from "zod";
import { HttpError } from "../utils/http.js";
import { sanitizeEmail, sanitizeText } from "../utils/sanitize.js";

const CANCELLATION_REASONS = [
  "CLIENTE_SOLICITOU",
  "DIVERGENCIA_DE_DADOS",
  "ENDERECO_INCORRETO",
  "MERCADORIA_INDISPONIVEL",
  "SOLICITACAO_DUPLICADA",
  "OUTROS",
] as const;

export type CancellationReason = (typeof CANCELLATION_REASONS)[number];

function digits(value: unknown, maxLength: number) {
  return sanitizeText(value, maxLength * 2).replace(/\D/g, "").slice(0, maxLength);
}

function requiredText(label: string, maxLength: number) {
  return z
    .unknown()
    .transform((value) => sanitizeText(value, maxLength))
    .refine(Boolean, `${label} é obrigatório.`);
}

function optionalText(maxLength: number) {
  return z.unknown().optional().transform((value) => sanitizeText(value, maxLength));
}

const cnpj = z
  .unknown()
  .transform((value) => digits(value, 14))
  .refine((value) => /^\d{14}$/.test(value), "Informe um CNPJ válido.");

const optionalCnpj = z
  .unknown()
  .optional()
  .transform((value) => digits(value, 14))
  .refine((value) => !value || /^\d{14}$/.test(value), "Informe um CNPJ válido.");

const remoteId = z
  .unknown()
  .transform((value) => sanitizeText(value, 30))
  .refine((value) => /^\d+$/.test(value), "Identificador remoto inválido.");

const optionalEslOperationToken = z
  .unknown()
  .optional()
  .transform((value) => sanitizeText(value, 2_048))
  .refine(
    (value) => !value || /^v1\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{24,}$/.test(value),
    "Autorização de operação inválida."
  );

const stateCode = z
  .unknown()
  .transform((value) => sanitizeText(value, 2).toUpperCase())
  .refine((value) => /^[A-Z]{2}$/.test(value), "Informe a UF com duas letras.");

const optionalStateCode = z
  .unknown()
  .optional()
  .transform((value) => sanitizeText(value, 2).toUpperCase())
  .refine((value) => !value || /^[A-Z]{2}$/.test(value), "Informe a UF com duas letras.");

const postalCode = z
  .unknown()
  .transform((value) => digits(value, 8))
  .refine((value) => /^\d{8}$/.test(value), "Informe um CEP válido.");

const date = z
  .unknown()
  .transform((value) => sanitizeText(value, 10))
  .refine(
    (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`)),
    "Informe uma data válida no formato AAAA-MM-DD."
  );

const optionalDate = z
  .unknown()
  .optional()
  .transform((value) => sanitizeText(value, 10))
  .refine(
    (value) => !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`))),
    "Informe uma data válida no formato AAAA-MM-DD."
  );

const time = z
  .unknown()
  .transform((value) => sanitizeText(value, 5))
  .refine(
    (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value),
    "Informe um horário válido no formato HH:MM."
  );

const optionalTime = z
  .unknown()
  .optional()
  .transform((value) => sanitizeText(value, 5))
  .refine(
    (value) => !value || /^([01]\d|2[0-3]):[0-5]\d$/.test(value),
    "Informe um horário válido no formato HH:MM."
  );

const positiveNumber = (label: string, maxValue: number) =>
  z.coerce
    .number({ error: `${label} deve ser numérico.` })
    .finite(`${label} deve ser finito.`)
    .positive(`${label} deve ser maior que zero.`)
    .max(maxValue, `${label} excede o limite permitido.`);

const city = z.object({
  name: requiredText("Cidade", 100),
  stateCode,
});

const quoteRequestSchema = z.object({
  customerCnpj: cnpj,
  senderCnpj: optionalCnpj,
  recipientCnpj: optionalCnpj,
  origin: city.extend({ postalCode }),
  destination: city.extend({ postalCode }),
  height: positiveNumber("Altura", 1_000),
  width: positiveNumber("Largura", 1_000),
  length: positiveNumber("Comprimento", 1_000),
  realWeight: positiveNumber("Peso real", 1_000_000),
  cubicVolume: positiveNumber("Metro cúbico", 100_000),
  invoiceValue: positiveNumber("Valor da NF", 100_000_000),
  invoiceVolumes: z.coerce
    .number({ error: "Quantidade de volumes deve ser numérica." })
    .int("Quantidade de volumes deve ser inteira.")
    .positive("Quantidade de volumes deve ser maior que zero.")
    .max(1_000_000, "Quantidade de volumes excede o limite permitido."),
  requesterName: requiredText("Nome do solicitante", 100),
  requesterPhone: z
    .unknown()
    .transform((value) => digits(value, 15))
    .refine((value) => /^\d{10,15}$/.test(value), "Informe um telefone válido."),
  requesterEmail: z
    .unknown()
    .transform((value) => sanitizeEmail(value))
    .refine(Boolean, "Informe um e-mail válido."),
  productClassificationName: optionalText(100),
  comments: optionalText(700),
});

const invoiceReferenceSchema = z.object({
  invoiceKey: z
    .unknown()
    .optional()
    .transform((value) => digits(value, 44))
    .refine((value) => !value || /^\d{44}$/.test(value), "Chave da NF deve ter 44 dígitos."),
  invoiceNumber: optionalText(40),
  invoiceSeries: optionalText(20),
  senderCnpj: optionalCnpj,
  recipientCnpj: optionalCnpj,
});

const invoiceLookupSchema = invoiceReferenceSchema.superRefine((value, ctx) => {
  if (!value.invoiceKey && !value.invoiceNumber) {
    ctx.addIssue({
      code: "custom",
      path: ["invoiceKey"],
      message: "Informe a chave ou o número da NF.",
    });
  }
  if (!value.senderCnpj && !value.recipientCnpj) {
    ctx.addIssue({
      code: "custom",
      path: ["senderCnpj"],
      message: "Informe o CNPJ do remetente ou do destinatário para validar a NF.",
    });
  }
});

const collectionAddressSchema = z
  .object({
    postalCode: optionalText(12).transform((value) => value.replace(/\D/g, "").slice(0, 8)),
    street: optionalText(160),
    number: optionalText(40),
    complement: optionalText(120),
    neighborhood: optionalText(100),
    city: optionalText(100),
    stateCode: optionalStateCode,
  })
  .optional()
  .transform((value) =>
    value ?? {
      postalCode: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      stateCode: "",
    }
  );

const collectionRequestSchema = z.object({
  customerCnpj: cnpj,
  pickupLocationCnpj: cnpj,
  senderCnpj: optionalCnpj,
  recipientCnpj: optionalCnpj,
  origin: city,
  serviceDate: date,
  serviceStartHour: time,
  serviceEndHour: time,
  deliveryAddress: collectionAddressSchema,
  invoiceValidationToken: optionalEslOperationToken,
  invoice: invoiceReferenceSchema,
  referenceNumber: optionalText(100),
  comments: optionalText(700),
}).superRefine((value, ctx) => {
  if (!value.invoiceValidationToken) return;

  if (!value.invoice.invoiceKey && !value.invoice.invoiceNumber) {
    ctx.addIssue({
      code: "custom",
      path: ["invoice"],
      message: "A autorização da NF exige a mesma chave ou número validado.",
    });
  }
  if (!value.invoice.senderCnpj && !value.invoice.recipientCnpj) {
    ctx.addIssue({
      code: "custom",
      path: ["invoice"],
      message: "A autorização da NF exige o CNPJ do remetente ou do destinatário validado.",
    });
  }
  if (
    value.invoice.senderCnpj !== value.senderCnpj ||
    value.invoice.recipientCnpj !== value.recipientCnpj
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["invoice"],
      message: "Os CNPJs da NF devem corresponder aos CNPJs informados para a coleta.",
    });
  }
});

const collectionUpdateSchema = z
  .object({
    serviceDate: optionalDate,
    serviceStartHour: optionalTime,
    serviceEndHour: optionalTime,
    comments: optionalText(700),
  })
  .superRefine((value, ctx) => {
    if (!value.serviceDate && !value.serviceStartHour && !value.serviceEndHour && !value.comments) {
      ctx.addIssue({
        code: "custom",
        message: "Informe ao menos um dado para atualizar a coleta.",
      });
    }
    if (value.serviceStartHour && value.serviceEndHour && value.serviceStartHour >= value.serviceEndHour) {
      ctx.addIssue({
        code: "custom",
        path: ["serviceEndHour"],
        message: "O horário final deve ser posterior ao horário inicial.",
      });
    }
  });

const collectionCancellationSchema = z
  .object({
    reason: z
      .unknown()
      .transform((value) => sanitizeText(value, 40).toUpperCase())
      .refine(
        (value): value is CancellationReason => CANCELLATION_REASONS.includes(value as CancellationReason),
        "Motivo de cancelamento inválido."
      ),
    otherReason: optionalText(300),
  })
  .superRefine((value, ctx) => {
    if (value.reason === "OUTROS" && !value.otherReason) {
      ctx.addIssue({
        code: "custom",
        path: ["otherReason"],
        message: "Descreva o motivo do cancelamento.",
      });
    }
  });

function parseOrThrow<T>(result: z.ZodSafeParseResult<T>): T {
  if (result.success) return result.data;
  throw new HttpError(422, result.error.issues[0]?.message ?? "Dados inválidos.");
}

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;
export type InvoiceLookupRequest = z.infer<typeof invoiceLookupSchema>;
export type CollectionRequest = z.infer<typeof collectionRequestSchema>;
export type CollectionUpdateRequest = z.infer<typeof collectionUpdateSchema>;
export type CollectionCancellationRequest = z.infer<typeof collectionCancellationSchema>;

export function parseQuoteRequest(value: unknown) {
  return parseOrThrow(quoteRequestSchema.safeParse(value));
}

export function parseInvoiceLookupRequest(value: unknown) {
  return parseOrThrow(invoiceLookupSchema.safeParse(value));
}

export function parseCollectionRequest(value: unknown) {
  return parseOrThrow(collectionRequestSchema.safeParse(value));
}

export function parseCollectionUpdateRequest(value: unknown) {
  return parseOrThrow(collectionUpdateSchema.safeParse(value));
}

export function parseCollectionCancellationRequest(value: unknown) {
  return parseOrThrow(collectionCancellationSchema.safeParse(value));
}

export function parseRemoteCollectionId(value: unknown) {
  return parseOrThrow(remoteId.safeParse(value));
}

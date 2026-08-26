import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import type { RequestHandler } from "express";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http.js";

const TOKEN_VERSION = "v1";
const INITIALIZATION_VECTOR_BYTES = 12;
const COLLECTION_MAINTENANCE_TTL_MS = 30 * 24 * 60 * 60 * 1_000;
const INVOICE_VALIDATION_TTL_MS = 15 * 60 * 1_000;

type EslOperationScope = "collection-maintenance" | "invoice-validation";

interface EslOperationTokenPayload {
  version: 1;
  scope: EslOperationScope;
  subject: string;
  fingerprint: string;
  expiresAt: number;
}

function tokenError() {
  return new HttpError(403, "A autorização desta operação é inválida ou expirou.");
}

function encode(value: Buffer) {
  return value.toString("base64url");
}

function decode(value: string) {
  try {
    return Buffer.from(value, "base64url");
  } catch {
    throw tokenError();
  }
}

function encryptionKey() {
  return createHash("sha256").update(env.eslOperationSecret, "utf8").digest();
}

function isValidPayload(value: unknown): value is EslOperationTokenPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const payload = value as Record<string, unknown>;
  return (
    payload.version === 1 &&
    (payload.scope === "collection-maintenance" || payload.scope === "invoice-validation") &&
    typeof payload.subject === "string" &&
    /^\d{1,40}$/.test(payload.subject) &&
    typeof payload.fingerprint === "string" &&
    /^[a-f0-9]{64}$/.test(payload.fingerprint) &&
    typeof payload.expiresAt === "number" &&
    Number.isSafeInteger(payload.expiresAt)
  );
}

function createToken(
  scope: EslOperationScope,
  subject: string,
  fingerprint: string,
  ttlMs: number
) {
  const payload: EslOperationTokenPayload = {
    version: 1,
    scope,
    subject,
    fingerprint,
    expiresAt: Date.now() + ttlMs,
  };
  const initializationVector = randomBytes(INITIALIZATION_VECTOR_BYTES);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), initializationVector);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  return `${TOKEN_VERSION}.${encode(initializationVector)}.${encode(encrypted)}`;
}

function readToken(token: string, expectedScope: EslOperationScope) {
  if (token.length > 2_048) throw tokenError();
  const [version, initializationVectorValue, encryptedValue, ...extra] = token.split(".");
  if (
    version !== TOKEN_VERSION ||
    !initializationVectorValue ||
    !encryptedValue ||
    extra.length > 0
  ) {
    throw tokenError();
  }

  const initializationVector = decode(initializationVectorValue);
  const encrypted = decode(encryptedValue);
  if (
    initializationVector.length !== INITIALIZATION_VECTOR_BYTES ||
    encrypted.length <= 16 ||
    encrypted.length > 2_000
  ) {
    throw tokenError();
  }

  try {
    const encryptedPayload = encrypted.subarray(0, -16);
    const authTag = encrypted.subarray(-16);
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), initializationVector);
    decipher.setAuthTag(authTag);
    const parsed: unknown = JSON.parse(
      Buffer.concat([decipher.update(encryptedPayload), decipher.final()]).toString("utf8")
    );
    if (!isValidPayload(parsed) || parsed.scope !== expectedScope || parsed.expiresAt <= Date.now()) {
      throw tokenError();
    }
    return parsed;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw tokenError();
  }
}

export function invoiceValidationFingerprint(input: {
  invoiceKey: string;
  invoiceNumber: string;
  invoiceSeries: string;
  senderCnpj: string;
  recipientCnpj: string;
}) {
  return createHash("sha256")
    .update(
      JSON.stringify([
        input.invoiceKey,
        input.invoiceNumber,
        input.invoiceSeries,
        input.senderCnpj,
        input.recipientCnpj,
      ]),
      "utf8"
    )
    .digest("hex");
}

export function createCollectionMaintenanceToken(collectionId: string) {
  return createToken(
    "collection-maintenance",
    collectionId,
    createHash("sha256").update(collectionId, "utf8").digest("hex"),
    COLLECTION_MAINTENANCE_TTL_MS
  );
}

export function requireCollectionMaintenanceToken(token: string | undefined, collectionId: string) {
  if (!token) throw tokenError();
  const payload = readToken(token, "collection-maintenance");
  const expectedFingerprint = createHash("sha256").update(collectionId, "utf8").digest("hex");
  if (payload.subject !== collectionId || payload.fingerprint !== expectedFingerprint) {
    throw tokenError();
  }
}

/**
 * A manutenção de uma coleta pública só aceita a capability devolvida no
 * momento da criação. O token permanece fora de URL e de payload JSON para
 * não ser propagado por links, histórico ou logs de corpo de requisição.
 */
export const requireCollectionMaintenanceCapability: RequestHandler = (req, _res, next) => {
  try {
    requireCollectionMaintenanceToken(
      req.header("x-collection-capability"),
      typeof req.params.id === "string" ? req.params.id : ""
    );
    next();
  } catch (error) {
    next(error);
  }
};

export function createInvoiceValidationToken(invoiceId: string, fingerprint: string) {
  return createToken("invoice-validation", invoiceId, fingerprint, INVOICE_VALIDATION_TTL_MS);
}

export function requireInvoiceValidationToken(token: string, fingerprint: string) {
  const payload = readToken(token, "invoice-validation");
  if (payload.fingerprint !== fingerprint) throw tokenError();
  return payload.subject;
}

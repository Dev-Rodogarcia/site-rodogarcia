import { HttpError } from "../utils/http.js";

function normalizePostalCode(value: unknown) {
  const postalCode = String(value ?? "").replace(/\D/g, "");
  if (!/^\d{8}$/.test(postalCode)) throw new HttpError(422, "Informe um CEP válido.");
  return postalCode;
}

export async function lookupPostalCode(value: unknown) {
  const postalCode = normalizePostalCode(value);
  let response: Response;
  try {
    response = await fetch(`https://viacep.com.br/ws/${postalCode}/json/`, {
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    throw new HttpError(503, "Não foi possível consultar o CEP agora.");
  }

  if (!response.ok) throw new HttpError(503, "Não foi possível consultar o CEP agora.");
  const data: unknown = await response.json().catch(() => null);
  if (!data || typeof data !== "object" || "erro" in data) {
    throw new HttpError(404, "CEP não encontrado.");
  }

  const address = data as { localidade?: unknown; uf?: unknown };
  const city = typeof address.localidade === "string" ? address.localidade.trim() : "";
  const stateCode = typeof address.uf === "string" ? address.uf.trim().toUpperCase() : "";
  if (!city || !/^[A-Z]{2}$/.test(stateCode)) throw new HttpError(404, "CEP não encontrado.");
  return { postalCode, city, stateCode };
}

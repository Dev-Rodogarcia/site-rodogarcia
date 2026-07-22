import { HttpError } from "../utils/http.js";

function normalizeCnpj(value: unknown) {
  const cnpj = String(value ?? "").replace(/\D/g, "");
  if (!/^\d{14}$/.test(cnpj)) throw new HttpError(422, "Informe um CNPJ válido.");
  return cnpj;
}

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function lookupCompanyAddress(value: unknown) {
  const cnpj = normalizeCnpj(value);
  let response: Response;
  try {
    response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    throw new HttpError(503, "Não foi possível confirmar o endereço pelo CNPJ agora.");
  }

  if (response.status === 404) throw new HttpError(404, "CNPJ não encontrado.");
  if (!response.ok) throw new HttpError(503, "Não foi possível confirmar o endereço pelo CNPJ agora.");
  const data: unknown = await response.json().catch(() => null);
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new HttpError(503, "Não foi possível confirmar o endereço pelo CNPJ agora.");
  }

  const company = data as Record<string, unknown>;
  const stateCode = text(company.uf, 2).toUpperCase();
  const city = text(company.municipio, 100);
  if (!city || !/^[A-Z]{2}$/.test(stateCode)) {
    throw new HttpError(404, "O CNPJ não possui endereço suficiente para confirmação.");
  }

  return {
    cnpj,
    postalCode: text(company.cep, 12).replace(/\D/g, "").slice(0, 8),
    street: text(company.logradouro, 160),
    number: text(company.numero, 40),
    complement: text(company.complemento, 120),
    neighborhood: text(company.bairro, 100),
    city,
    stateCode,
  };
}

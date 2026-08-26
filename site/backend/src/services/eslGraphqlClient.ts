import { env } from "../config/env.js";
import { HttpError } from "../utils/http.js";

const ESL_MIN_REQUEST_INTERVAL_MS = 2_000;
const ESL_REQUEST_TIMEOUT_MS = 20_000;

type Sleep = (milliseconds: number) => Promise<void>;
type Clock = () => number;

const sleep: Sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export class EslRequestScheduler {
  private nextRequestAt = 0;

  constructor(
    private readonly minimumIntervalMs = ESL_MIN_REQUEST_INTERVAL_MS,
    private readonly now: Clock = Date.now,
    private readonly wait: Sleep = sleep
  ) {}

  async run<T>(operation: () => Promise<T>) {
    const requestedAt = this.now();
    const scheduledAt = Math.max(requestedAt, this.nextRequestAt);
    this.nextRequestAt = scheduledAt + this.minimumIntervalMs;

    if (scheduledAt > requestedAt) {
      await this.wait(scheduledAt - requestedAt);
    }

    return operation();
  }
}

const scheduler = new EslRequestScheduler();

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function graphqlErrors(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (isRecord(item) && typeof item.message === "string" ? item.message : ""))
    .filter(Boolean);
}

export class EslGraphqlResponseError extends Error {
  constructor(public readonly errors: string[]) {
    super("A API ESL rejeitou a solicitação.");
  }
}

export async function executeEslGraphql(query: string, variables: Record<string, unknown>) {
  if (!env.eslGraphqlApiKey || !env.eslGraphqlUrl) {
    throw new HttpError(503, "A integração com o ESL não está configurada.");
  }

  return scheduler.run(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ESL_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(env.eslGraphqlUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.eslGraphqlApiKey}`,
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        throw new HttpError(
          response.status === 429 ? 503 : 502,
          response.status === 429
            ? "O ESL está temporariamente indisponível. Tente novamente em alguns segundos."
            : "Não foi possível comunicar com o ESL. Tente novamente mais tarde."
        );
      }

      if (!isRecord(payload)) {
        throw new HttpError(502, "O ESL retornou uma resposta inválida.");
      }

      const errors = graphqlErrors(payload.errors);
      if (errors.length > 0) throw new EslGraphqlResponseError(errors);
      return payload.data;
    } catch (error) {
      if (error instanceof HttpError || error instanceof EslGraphqlResponseError) throw error;
      throw new HttpError(503, "Não foi possível comunicar com o ESL. Tente novamente mais tarde.");
    } finally {
      clearTimeout(timeout);
    }
  });
}

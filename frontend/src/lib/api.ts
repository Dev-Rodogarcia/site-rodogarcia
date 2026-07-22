import type { ApiResponse } from "@/types/api";
import { api } from "@/lib/routes";
import type {
  AboutPageContent,
  BusinessPageContent,
  CareersPageContent,
  CollectionsPageContent,
  ContactPageContent,
  FooterLinksContent,
  HomePageContent,
  OperationalUnit,
  QuotePageContent,
  ServicesPageContent,
} from "@/types/content";

const normalizeBackendUrl = (url: string) => url.replace(/\/+$/, "");

const firstConfiguredBackendUrl = (...values: Array<string | undefined>): string =>
  values.find((value) => value?.trim())?.trim() ?? "http://127.0.0.1:6050";

const API_BASE_URL = normalizeBackendUrl(
  firstConfiguredBackendUrl(
    process.env.BACKEND_PROXY_URL,
    process.env.NEXT_PUBLIC_BACKEND_PROXY_URL,
    process.env.BACKEND_INTERNAL_URL,
    process.env.NEXT_PUBLIC_BACKEND_URL
  )
);

export interface PublicContentResponse {
  homePage: HomePageContent;
  servicesPage: ServicesPageContent;
  aboutPage: AboutPageContent;
  businessPage: BusinessPageContent;
  contactPage: ContactPageContent;
  careersPage: CareersPageContent;
  quotePage: QuotePageContent;
  collectionsPage: CollectionsPageContent;
  footerLinks: FooterLinksContent;
  units: OperationalUnit[];
  siteTexts: Record<string, string>;
}

/**
 * Fetch tipado para uso em Server Components (não inclui CSRF token).
 * Usa Next.js fetch com cache tag para ISR.
 */
export async function serverFetch<T>(
  path: string,
  options?: RequestInit & { tags?: string[] }
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${path}`;

  try {
    const res = await fetch(url, {
      ...options,
      next: options?.tags ? { tags: options.tags } : undefined,
    });

    if (!res.ok) {
      const errorBody = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      return {
        success: false,
        error: errorBody.error ?? `HTTP ${res.status}`,
      };
    }

    const data = (await res.json()) as T;
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro de rede.",
    };
  }
}

/**
 * Lê o conteúdo público da API.
 * Chamado em RSC pages para pré-renderizar o conteúdo no servidor.
 */
export async function fetchPublicContent() {
  return serverFetch<PublicContentResponse>(api.public.content, {
    tags: ["public-content"],
    cache: "no-store",
  });
}

import { fetchPublicContent } from "@/lib/api";
import { DEFAULT_FOOTER_LINKS } from "@/lib/footerLinksDefaults";
import type { FooterLinksContent, PageButton } from "@/types/content";

export function toPageAction(button: PageButton, variant?: "primary" | "secondary" | "ghost") {
  return {
    label: button.label,
    href: button.url,
    external: button.external,
    variant,
  };
}

export async function fetchFooterLinksContent(): Promise<FooterLinksContent> {
  try {
    const response = await fetchPublicContent();
    if (response.success && response.data?.footerLinks) {
      return response.data.footerLinks;
    }
  } catch {
    // Public pages keep their CMS defaults visible if the API is temporarily unavailable.
  }

  return DEFAULT_FOOTER_LINKS;
}

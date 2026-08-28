import { CampaignV1View } from "@/templates/CampaignV1View";
import type { PublicLandingPage } from "@/lib/landing";

/** Encaminha a campanha ao renderizador do template informado pelo DTO público. */
export function LandingPageView({ landing, preview = false }: { landing: PublicLandingPage; preview?: boolean }) {
  switch (landing.template) {
    case "campaign-v1":
      return <CampaignV1View landing={landing} preview={preview} />;
  }
}

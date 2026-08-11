import { storagePaths } from "../config/storagePaths.js";
import type { CmsPermission } from "../types/auth.js";
import { readJsonFile, writeJsonFile } from "../utils/jsonStore.js";

export interface CmsAccessProfile {
  id: string;
  name: string;
  description: string;
  permissions: CmsPermission[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Store { profiles: CmsAccessProfile[]; }
const seededProfiles = (): CmsAccessProfile[] => {
  const now = "2026-08-11T00:00:00.000Z";
  return [
    { id: "sector-content", name: "Conteúdo institucional", description: "Páginas, navegação e rodapé do site.", permissions: ["home", "services", "about-page", "business-page", "contact-page", "careers-page", "collections", "quote-page", "improvements", "header-navigation", "footer-links", "units"], active: true, createdAt: now, updatedAt: now },
    { id: "sector-marketing", name: "Marketing e comunicação", description: "Conteúdo, mídias, SEO e campanhas do site.", permissions: ["dashboard", "home", "services", "about-page", "business-page", "contact-page", "careers-page", "images", "popup", "seo", "analytics"], active: true, createdAt: now, updatedAt: now },
    { id: "sector-commercial", name: "Comercial e atendimento", description: "Cotação, coletas, contatos e leads recebidos.", permissions: ["dashboard", "quote-page", "collections", "contact-page", "leads", "units"], active: true, createdAt: now, updatedAt: now },
    { id: "sector-operations", name: "Operações", description: "Unidades, coletas e rastreamento operacional.", permissions: ["dashboard", "collections", "units", "tracking"], active: true, createdAt: now, updatedAt: now },
    { id: "sector-privacy", name: "Privacidade e qualidade", description: "Consentimentos, LGPD e sugestões de melhoria.", permissions: ["dashboard", "improvements", "cookie-monitoring", "cookies"], active: true, createdAt: now, updatedAt: now },
  ];
};
const defaults = (): Store => ({ profiles: seededProfiles() });
function read(): Store {
  const data = readJsonFile<Store>(storagePaths.cmsAccessProfiles, defaults());
  if (!data || !Array.isArray(data.profiles)) throw new Error("Armazenamento de perfis de acesso inválido.");
  const missingSeeds = seededProfiles().filter((seed) => !data.profiles.some((profile) => profile.id === seed.id));
  if (missingSeeds.length === 0) return data;
  const next = { profiles: [...data.profiles, ...missingSeeds] };
  writeJsonFile(storagePaths.cmsAccessProfiles, next);
  return next;
}
export const cmsAccessProfileRepository = {
  list: () => read().profiles,
  findById: (id: string) => read().profiles.find((profile) => profile.id === id) ?? null,
  create(profile: CmsAccessProfile) { const store = read(); store.profiles.push(profile); writeJsonFile(storagePaths.cmsAccessProfiles, store); return profile; },
  update(id: string, patch: Partial<CmsAccessProfile>) { const store = read(); const index = store.profiles.findIndex((profile) => profile.id === id); if (index < 0) return null; const next = { ...store.profiles[index]!, ...patch }; store.profiles[index] = next; writeJsonFile(storagePaths.cmsAccessProfiles, store); return next; },
  remove(id: string) { const store = read(); const next = store.profiles.filter((profile) => profile.id !== id); if (next.length === store.profiles.length) return false; writeJsonFile(storagePaths.cmsAccessProfiles, { profiles: next }); return true; },
};

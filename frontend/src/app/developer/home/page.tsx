"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  CaretDown,
  CaretLeft,
  CaretRight,
  CheckCircle,
  ImageSquare,
  Plus,
  Trash,
  VideoCamera,
} from "@phosphor-icons/react";
import { useApiRequest } from "@/hooks/useApiRequest";
import {
  adminResourceKeys,
  invalidateAdminResource,
} from "@/hooks/useAdminResource";
import { api } from "@/lib/routes";
import type {
  HomeFeedback,
  HomeHeroButton,
  HomeHeroMode,
  HomeHeroSlide,
  HomeInteractiveItem,
  HomeMedia,
  HomeOperationItem,
  HomePageContent,
  HomeRegionalUnit,
  HomeServiceCard,
  OperationalUnit,
} from "@/types/content";
import { cn } from "@/lib/utils";
import {
  DeveloperMediaField,
  DeveloperMediaPreview,
} from "@/components/developer/DeveloperMediaField";
import {
  DeveloperCard,
  DeveloperColorField,
  DeveloperField,
  DeveloperHero,
  DeveloperMessage,
  DeveloperPage,
  DeveloperSectionHeading,
  DeveloperStatusPill,
  developerDangerButtonClassName,
  developerGhostButtonClassName,
  developerInputClassName,
  developerPrimaryButtonClassName,
  developerSecondaryButtonClassName,
} from "@/components/developer/ui";

type SaveKey =
  | "hero"
  | "section1"
  | "section2"
  | "section3"
  | "regionalPresence"
  | "trackingCta"
  | "socialProof";

const HOME_STEPS = [
  {
    key: "hero",
    step: "Etapa 1",
    title: "Hero principal",
    description: "Carrossel inicial, mídias e botões de entrada da Home.",
  },
  {
    key: "section1",
    step: "Etapa 2",
    title: "Previsibilidade",
    description: "Título, 3 abas clicáveis e CTA da primeira seção.",
  },
  {
    key: "section2",
    step: "Etapa 3",
    title: "Operacao conectada",
    description: "Ate 5 itens da area escura em desktop e mobile.",
  },
  {
    key: "section3",
    step: "Etapa 4",
    title: "Linhas de servico",
    description: "Badge, texto principal e cards paginados de soluções.",
  },
  {
    key: "regionalPresence",
    step: "Etapa 5",
    title: "Presenca Regional",
    description: "Unidades exibidas no mapa e no card de unidade ativa.",
  },
  {
    key: "trackingCta",
    step: "Etapa 6",
    title: "Rastreie sua carga",
    description: "Somente textos e links dos dois botões da área de rastreio.",
  },
  {
    key: "socialProof",
    step: "Etapa 7",
    title: "Prova social",
    description: "Depoimentos, logos, estrelas, ordem e visibilidade.",
  },
] as const;

type HomeStepKey = (typeof HOME_STEPS)[number]["key"];

const EMPTY_MEDIA: HomeMedia = {
  type: "image",
  src: "",
  alt: "",
  poster: "",
  desktopSrc: "",
  mobileSrc: "",
};

const EMPTY_BUTTON: HomeHeroButton = {
  label: "",
  url: "",
  enabled: false,
  color: "#1d4ed8",
  variant: "solid",
};

const BRAZIL_UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function emptyHomePage(): HomePageContent {
  return {
    hero: { slides: [] },
    section1: {
      title: "",
      ctaLabel: "",
      ctaUrl: "",
      items: Array.from({ length: 3 }, (_, index) => emptySection1Item(index)),
    },
    section2: { title: "", items: [] },
    section3: {
      badge: "",
      title: "",
      description: "",
      ctaLabel: "",
      ctaUrl: "",
      cards: Array.from({ length: 3 }, (_, index) => emptyServiceCard(index)),
    },
    regionalPresence: { units: [] },
    trackingCta: {
      buttons: [
        {
          label: "Rastrear agora",
          url: "https://rodogarcia.eslcloud.com.br/recipient_tracking",
          enabled: true,
          color: "#1d4ed8",
          variant: "solid",
        },
        {
          label: "Como consultar",
          url: "/central-ajuda",
          enabled: true,
          color: "#ffffff",
          variant: "outline",
        },
      ],
    },
    socialProof: { title: "", feedbacks: [] },
  };
}

function emptyMedia(type: HomeMedia["type"] = "image"): HomeMedia {
  return { ...EMPTY_MEDIA, type };
}

function emptyHeroSlide(): HomeHeroSlide {
  return {
    id: createId("home-hero"),
    title: "",
    description: "",
    media: emptyMedia(),
    active: true,
    mode: "text-media-buttons",
    buttons: [
      { ...EMPTY_BUTTON, enabled: true },
      { ...EMPTY_BUTTON, color: "#ffffff", variant: "outline" },
    ],
  };
}

function emptySection1Item(index: number): HomeInteractiveItem {
  return {
    id: `section1-${index + 1}`,
    order: index + 1,
    title: "",
    description: "",
    media: emptyMedia(),
  };
}

function emptySection2Item(): HomeOperationItem {
  return {
    id: createId("section2"),
    title: "",
    description: "",
    media: emptyMedia(),
    active: true,
  };
}

function emptyServiceCard(index: number): HomeServiceCard {
  return {
    id: index < 3 ? `section3-card-${index + 1}` : createId("section3-card"),
    order: index + 1,
    media: emptyMedia(),
    badge: "",
    title: "",
    description: "",
    ctaLabel: "",
    ctaUrl: "",
  };
}

function emptyFeedback(): HomeFeedback {
  return {
    id: createId("home-feedback"),
    name: "",
    role: "",
    company: "",
    testimonial: "",
    photo: "",
    rating: 5,
    active: true,
  };
}

function emptyRegionalUnit(): HomeRegionalUnit {
  return {
    id: createId("home-unit"),
    name: "",
    state: "SP",
    description: "",
    linkedUnitId: "",
    address: "",
    phone: "",
    email: "",
    buttonLabel: "Falar com esta unidade",
    contactUrl: "/fale-conosco",
    active: true,
  };
}

function normalizeTrackingButtons(buttons?: HomeHeroButton[]) {
  const fallback = emptyHomePage().trackingCta.buttons;
  return Array.from({ length: 2 }, (_, index) => ({
    ...fallback[index],
    ...(buttons?.[index] ?? {}),
    enabled: buttons?.[index]?.enabled ?? true,
  }));
}

function normalizeHomePage(data?: HomePageContent): HomePageContent {
  const fallback = emptyHomePage();
  if (!data) return fallback;
  return {
    hero: {
      slides: Array.isArray(data.hero?.slides) ? data.hero.slides : [],
    },
    section1: {
      ...fallback.section1,
      ...data.section1,
      items: Array.from({ length: 3 }, (_, index) => {
        const item = data.section1?.items?.[index];
        return item ? { ...emptySection1Item(index), ...item } : emptySection1Item(index);
      }),
    },
    section2: {
      title: data.section2?.title ?? "",
      items: Array.isArray(data.section2?.items) ? data.section2.items.slice(0, 5) : [],
    },
    section3: {
      ...fallback.section3,
      ...data.section3,
      cards:
        Array.isArray(data.section3?.cards) && data.section3.cards.length > 0
          ? data.section3.cards.map((card, index) => ({ ...emptyServiceCard(index), ...card }))
          : fallback.section3.cards,
    },
    regionalPresence: {
      units: Array.isArray(data.regionalPresence?.units)
        ? data.regionalPresence.units
        : [],
    },
    trackingCta: {
      buttons: normalizeTrackingButtons(data.trackingCta?.buttons),
    },
    socialProof: {
      title: data.socialProof?.title ?? "",
      feedbacks: Array.isArray(data.socialProof?.feedbacks)
        ? data.socialProof.feedbacks
        : [],
    },
  };
}

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  const [selected] = next.splice(index, 1);
  next.splice(target, 0, selected);
  return next;
}

function CountHint({
  value,
  maxLength,
  maxWords,
}: {
  value: string;
  maxLength?: number;
  maxWords?: number;
}) {
  const words = wordCount(value);
  return (
    <span className="mt-1 block text-[11px] text-[var(--color-muted-raw)]">
      {maxWords ? `${words}/${maxWords} palavras` : null}
      {maxWords && maxLength ? " - " : null}
      {maxLength ? `${value.length}/${maxLength} caracteres` : null}
    </span>
  );
}

const homeFormGroupClassName =
  "rounded-[22px] border border-[var(--border)]/80 bg-slate-50/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] sm:p-5";

const homeNestedPanelClassName =
  "rounded-[20px] border border-slate-200/80 bg-white/72 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]";

function homeEditableCardClassName(active = true) {
  return cn(
    "relative overflow-hidden rounded-[24px] border p-4 shadow-[0_12px_28px_rgba(15,23,42,0.045)] transition-colors sm:p-5",
    "before:absolute before:inset-x-0 before:top-0 before:h-1",
    active
      ? "border-[var(--primary)]/24 bg-slate-50/86 before:bg-[var(--primary)]"
      : "border-slate-200/90 bg-slate-50/58 before:bg-slate-300/80"
  );
}

function HomeItemHeader({
  label,
  title,
  description,
  active,
  actions,
}: {
  label: string;
  title: string;
  description: string;
  active?: boolean;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 border-b border-slate-200/70 pb-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-raw)]">
            {label}
          </span>
          {typeof active === "boolean" ? <DeveloperStatusPill active={active} /> : null}
        </div>
        <h3 className="mt-3 text-base font-semibold tracking-[-0.015em] text-[var(--foreground)]">
          {title}
        </h3>
        <p className="mt-1 max-w-[68ch] text-sm leading-6 text-[var(--color-muted-raw)]">
          {description}
        </p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

function HomeAccordionCard({
  label,
  title,
  description,
  active,
  open,
  onToggle,
  actions,
  children,
}: {
  label: string;
  title: string;
  description: string;
  active?: boolean;
  open: boolean;
  onToggle: () => void;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-[24px] border transition-all duration-300",
        open
          ? "border-[var(--primary)]/24 bg-slate-50/86 shadow-[0_14px_34px_rgba(15,23,42,0.07)]"
          : "border-slate-200/90 bg-slate-50/58 shadow-[0_8px_20px_rgba(15,23,42,0.035)]"
      )}
    >
      <div
        className={cn(
          "h-1 transition-colors duration-300",
          open ? "bg-[var(--primary)]" : "bg-slate-300/80"
        )}
      />
      <div className="flex flex-col gap-3 px-4 py-4 sm:px-5 lg:flex-row lg:items-start lg:justify-between">
        <button
          type="button"
          onClick={onToggle}
          className="min-w-0 flex-1 text-left"
          aria-expanded={open}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-raw)]">
              {label}
            </span>
            {typeof active === "boolean" ? <DeveloperStatusPill active={active} /> : null}
          </div>
          <h3 className="mt-3 truncate text-base font-semibold tracking-[-0.015em] text-[var(--foreground)]">
            {title}
          </h3>
          <p className="mt-1 max-w-[68ch] text-sm leading-6 text-[var(--color-muted-raw)]">
            {description}
          </p>
        </button>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
          <button
            type="button"
            onClick={onToggle}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-2xl border border-[var(--border)] bg-white text-[var(--color-muted-raw)] transition-transform duration-300",
              open ? "rotate-180 text-[var(--primary)]" : ""
            )}
            aria-label={open ? "Fechar item" : "Abrir item"}
          >
            <CaretDown size={16} weight="bold" />
          </button>
        </div>
      </div>
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-slate-200/70 p-4 sm:p-5">{children}</div>
        </div>
      </div>
    </article>
  );
}

function HomeMediaEditor({
  label,
  media,
  onChange,
  required,
}: {
  label: string;
  media: HomeMedia;
  onChange: (media: HomeMedia) => void;
  required?: boolean;
}) {
  const current = { ...EMPTY_MEDIA, ...media };
  const MediaIcon = current.type === "video" ? VideoCamera : ImageSquare;
  return (
    <div className="rounded-[22px] border border-[var(--primary)]/14 bg-white/72 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] sm:p-5">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--primary)]/16 bg-[var(--primary)]/8 text-[var(--primary)]">
          <MediaIcon size={20} weight="bold" />
        </span>
        <div>
          <h4 className="text-sm font-semibold text-[var(--foreground)]">{label}</h4>
          <p className="mt-1 max-w-[72ch] text-xs leading-5 text-[var(--color-muted-raw)]">
            Escolha imagem ou vídeo. Vídeos ficam sem conversão; imagens enviadas pela biblioteca viram WebP.
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
        <div className="order-2 lg:order-1 lg:row-span-2">
          <DeveloperMediaPreview
            value={current.src}
            previewAlt={current.alt || label}
            mediaType={current.type}
          />
        </div>

        <div className={cn(homeNestedPanelClassName, "order-1 lg:order-2")}>
          <div className="grid gap-5 xl:grid-cols-[180px_minmax(0,1fr)]">
            <DeveloperField label="Tipo" required={required}>
              <select
                value={current.type}
                onChange={(event) =>
                  onChange({ ...current, type: event.target.value as HomeMedia["type"] })
                }
                className={developerInputClassName}
              >
                <option value="image">Imagem</option>
                <option value="video">Vídeo</option>
              </select>
            </DeveloperField>
            <DeveloperMediaField
              label="Arquivo"
              required={required}
              mediaType={current.type}
              value={current.src}
              onChange={(src) => onChange({ ...current, src })}
              hint="Onde aparece: area visual desta parte da Home."
              previewAlt={current.alt || label}
              showPreview={false}
            />
          </div>
        </div>

        <div className={cn(homeNestedPanelClassName, "order-3 lg:order-3")}>
          <div className="grid gap-4 lg:grid-cols-3">
            <DeveloperField label="Texto alternativo">
              <input
                value={current.alt ?? ""}
                onChange={(event) => onChange({ ...current, alt: event.target.value })}
                maxLength={140}
                className={developerInputClassName}
              />
            </DeveloperField>
            <DeveloperField label="Midia desktop" hint="Opcional. Substitui o arquivo principal no desktop.">
              <input
                value={current.desktopSrc ?? ""}
                onChange={(event) => onChange({ ...current, desktopSrc: event.target.value })}
                className={developerInputClassName}
                placeholder="/uploads/desktop.webp"
              />
            </DeveloperField>
            <DeveloperField label="Midia mobile" hint="Opcional. Substitui o arquivo principal no mobile.">
              <input
                value={current.mobileSrc ?? ""}
                onChange={(event) => onChange({ ...current, mobileSrc: event.target.value })}
                className={developerInputClassName}
                placeholder="/uploads/mobile.webp"
              />
            </DeveloperField>
          </div>

          {current.type === "video" ? (
            <div className="mt-4 rounded-[20px] border border-slate-200/80 bg-slate-50/72 p-4">
              <DeveloperMediaField
                label="Poster do video"
                mediaType="image"
                value={current.poster ?? ""}
                onChange={(poster) => onChange({ ...current, poster })}
                hint="Opcional. Imagem exibida antes do video carregar."
                showPreview={false}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SaveButton({
  saving,
  children,
}: {
  saving: boolean;
  children: string;
}) {
  return (
    <button type="submit" disabled={saving} className={developerPrimaryButtonClassName}>
      <CheckCircle size={18} weight="bold" />
      {saving ? "Salvando..." : children}
    </button>
  );
}

export default function DeveloperHomePage() {
  const { apiRequest } = useApiRequest();
  const [home, setHome] = useState<HomePageContent>(emptyHomePage);
  const [availableUnits, setAvailableUnits] = useState<OperationalUnit[]>([]);
  const [activeStep, setActiveStep] = useState<HomeStepKey>("hero");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<SaveKey | "">("");
  const [status, setStatus] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);
  const [openHeroSlide, setOpenHeroSlide] = useState<number | null>(null);
  const [openSection1Item, setOpenSection1Item] = useState<number | null>(null);
  const [openSection2Item, setOpenSection2Item] = useState<number | null>(null);
  const [openSection3Card, setOpenSection3Card] = useState<number | null>(null);
  const [activeRegionalUnit, setActiveRegionalUnit] = useState(0);
  const [openFeedback, setOpenFeedback] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      const [response, unitsResponse] = await Promise.all([
        apiRequest<{ homePage?: HomePageContent }>(api.admin.home),
        apiRequest<{ items?: OperationalUnit[] }>(api.admin.entity("units")),
      ]);
      if (!alive) return;
      if (response.success) {
        setHome(normalizeHomePage(response.data?.homePage));
        if (unitsResponse.success) {
          setAvailableUnits(unitsResponse.data?.items ?? []);
        }
        setStatus(null);
      } else {
        setStatus({ tone: "error", text: response.error ?? "Falha ao carregar a Home." });
      }
      setLoading(false);
    }
    void load();
    return () => {
      alive = false;
    };
  }, [apiRequest]);

  const summary = useMemo(
    () => ({
      hero: home.hero.slides.length,
      section2: home.section2.items.length,
      units: home.regionalPresence.units.filter((item) => item.active !== false).length,
      feedbacks: home.socialProof.feedbacks.filter((item) => item.active !== false).length,
    }),
    [home]
  );
  const activeStepIndex = Math.max(
    0,
    HOME_STEPS.findIndex((step) => step.key === activeStep)
  );
  const activeStepInfo = HOME_STEPS[activeStepIndex] ?? HOME_STEPS[0];

  function selectStep(step: HomeStepKey) {
    setActiveStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function moveStep(direction: -1 | 1) {
    const nextStep = HOME_STEPS[activeStepIndex + direction];
    if (nextStep) selectStep(nextStep.key);
  }

  async function saveSection(section: SaveKey, endpoint: string, payload: unknown) {
    setSaving(section);
    setStatus(null);
    const response = await apiRequest<{ homePage?: HomePageContent }>(endpoint, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    setSaving("");

    if (!response.success) {
      setStatus({ tone: "error", text: response.error ?? "Falha ao salvar a Home." });
      return;
    }

    setHome(normalizeHomePage(response.data?.homePage));
    setStatus({ tone: "success", text: "Bloco salvo com sucesso." });
    invalidateAdminResource([adminResourceKeys.dashboard, adminResourceKeys.images]);
  }

  function updateHeroSlide(index: number, patch: Partial<HomeHeroSlide>) {
    setHome((current) => ({
      ...current,
      hero: {
        slides: current.hero.slides.map((slide, slideIndex) =>
          slideIndex === index ? { ...slide, ...patch } : slide
        ),
      },
    }));
  }

  function updateSection1Item(index: number, patch: Partial<HomeInteractiveItem>) {
    setHome((current) => ({
      ...current,
      section1: {
        ...current.section1,
        items: current.section1.items.map((item, itemIndex) =>
          itemIndex === index ? { ...item, ...patch } : item
        ),
      },
    }));
  }

  function updateSection2Item(index: number, patch: Partial<HomeOperationItem>) {
    setHome((current) => ({
      ...current,
      section2: {
        ...current.section2,
        items: current.section2.items.map((item, itemIndex) =>
          itemIndex === index ? { ...item, ...patch } : item
        ),
      },
    }));
  }

  function updateSection3Card(index: number, patch: Partial<HomeServiceCard>) {
    setHome((current) => ({
      ...current,
      section3: {
        ...current.section3,
        cards: current.section3.cards.map((card, cardIndex) =>
          cardIndex === index ? { ...card, ...patch } : card
        ),
      },
    }));
  }

  function addSection3Card() {
    setHome((current) => {
      const cards = [...current.section3.cards, emptyServiceCard(current.section3.cards.length)];
      setOpenSection3Card(cards.length - 1);
      return {
        ...current,
        section3: {
          ...current.section3,
          cards,
        },
      };
    });
  }

  function removeSection3Card(index: number) {
    setHome((current) => {
      const cards = current.section3.cards.filter((_, cardIndex) => cardIndex !== index);
      setOpenSection3Card((open) => {
        if (open === null) return null;
        return Math.max(0, Math.min(open, cards.length - 1));
      });
      return {
        ...current,
        section3: {
          ...current.section3,
          cards,
        },
      };
    });
  }

  function updateRegionalUnit(index: number, patch: Partial<HomeRegionalUnit>) {
    setHome((current) => ({
      ...current,
      regionalPresence: {
        units: current.regionalPresence.units.map((unit, unitIndex) =>
          unitIndex === index ? { ...unit, ...patch } : unit
        ),
      },
    }));
  }

  function addRegionalUnit() {
    setHome((current) => {
      const units = [...current.regionalPresence.units, emptyRegionalUnit()];
      setActiveRegionalUnit(units.length - 1);
      return {
        ...current,
        regionalPresence: { units },
      };
    });
  }

  function removeRegionalUnit(index: number) {
    setHome((current) => {
      const units = current.regionalPresence.units.filter((_, unitIndex) => unitIndex !== index);
      setActiveRegionalUnit((page) => Math.max(0, Math.min(page, units.length - 1)));
      return {
        ...current,
        regionalPresence: { units },
      };
    });
  }

  function applyLinkedUnit(index: number, linkedUnitId: string) {
    const linked = availableUnits.find((unit) => unit.id === linkedUnitId);
    if (!linked) {
      updateRegionalUnit(index, { linkedUnitId });
      return;
    }
    updateRegionalUnit(index, {
      linkedUnitId,
      name: linked.name || "",
      state: (linked.state || "SP").toUpperCase(),
      description: linked.description || linked.type || "",
      address: linked.address || "",
      phone: linked.phone || "",
      email: linked.email || "",
      contactUrl: linked.contactUrl || "/fale-conosco",
    });
  }

  function updateTrackingButton(index: number, patch: Partial<HomeHeroButton>) {
    setHome((current) => {
      const buttons = normalizeTrackingButtons(current.trackingCta.buttons);
      buttons[index] = { ...buttons[index], ...patch };
      return {
        ...current,
        trackingCta: { buttons },
      };
    });
  }

  function updateFeedback(index: number, patch: Partial<HomeFeedback>) {
    setHome((current) => ({
      ...current,
      socialProof: {
        ...current.socialProof,
        feedbacks: current.socialProof.feedbacks.map((feedback, feedbackIndex) =>
          feedbackIndex === index ? { ...feedback, ...patch } : feedback
        ),
      },
    }));
  }

  return (
    <DeveloperPage>
      <DeveloperHero
        eyebrow="Home - Pagina Inicial"
        title="Editor completo da Home."
        description="Edite os cinco blocos principais da página inicial em um único lugar, com limites claros e dados padronizados."
        stats={[
          { label: "Hero", value: summary.hero },
          { label: "Seção 2", value: summary.section2 },
          { label: "Unidades", value: summary.units },
          { label: "Feedbacks", value: summary.feedbacks },
        ]}
      />

      {loading ? (
        <div className="mt-5">
          <DeveloperMessage tone="info">Carregando configuracao da Home...</DeveloperMessage>
        </div>
      ) : null}
      {status ? (
        <div className="mt-5">
          <DeveloperMessage tone={status.tone}>{status.text}</DeveloperMessage>
        </div>
      ) : null}

      <section className="mt-5 rounded-[26px] border border-[var(--border)] bg-white/88 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] backdrop-blur sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
              Edicao por etapas
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-[var(--foreground)]">
              {activeStepInfo.title}
            </h2>
            <p className="mt-1 max-w-[68ch] text-sm leading-6 text-[var(--color-muted-raw)]">
              {activeStepInfo.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => moveStep(-1)}
              disabled={activeStepIndex === 0}
              className={cn(
                developerSecondaryButtonClassName,
                "rounded-full px-5 disabled:cursor-not-allowed disabled:opacity-45"
              )}
            >
              <CaretLeft size={16} weight="bold" />
              Anterior
            </button>
            <button
              type="button"
              onClick={() => moveStep(1)}
              disabled={activeStepIndex === HOME_STEPS.length - 1}
              className={cn(
                developerSecondaryButtonClassName,
                "rounded-full px-5 disabled:cursor-not-allowed disabled:opacity-45"
              )}
            >
              Proximo
              <CaretRight size={16} weight="bold" />
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
          {HOME_STEPS.map((step, index) => {
            const active = step.key === activeStep;
            return (
              <button
                key={step.key}
                type="button"
                onClick={() => selectStep(step.key)}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "group relative overflow-hidden rounded-[20px] border px-4 py-4 text-left transition-all duration-300",
                  "before:absolute before:inset-x-0 before:top-0 before:h-1 before:transition-colors",
                  active
                    ? "border-[var(--primary)]/34 bg-white text-[var(--foreground)] shadow-[0_14px_34px_rgba(29,78,216,0.13)] before:bg-[var(--primary)]"
                    : "border-slate-200/86 bg-slate-50/72 text-[var(--foreground)] shadow-[0_8px_18px_rgba(15,23,42,0.025)] before:bg-transparent hover:border-[var(--primary)]/24 hover:bg-white hover:shadow-[0_12px_24px_rgba(15,23,42,0.055)]"
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-bold",
                      active
                        ? "border-[var(--primary)]/22 bg-[var(--primary)]/10 text-[var(--primary)]"
                        : "border-slate-200 bg-white text-[var(--color-muted-raw)]"
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-raw)]">
                    {step.step}
                  </span>
                </span>
                <span className="mt-3 block text-sm font-semibold">{step.title}</span>
                <span className="mt-1 block text-xs leading-5 text-[var(--color-muted-raw)]">
                  {step.description}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="mt-5 grid gap-5">
        {activeStep === "hero" ? (
        <DeveloperCard id="hero" className="p-5 sm:p-6">
          <DeveloperSectionHeading
            eyebrow="Etapa 1 - topo da Home"
            title="Hero principal"
            description="Controla o carrossel inicial. Use 'somente mídia completa' para banners sem texto nem botões."
            action={
              <button
                type="button"
                onClick={() =>
                  setHome((current) => ({
                    ...current,
                    hero: { slides: [...current.hero.slides, emptyHeroSlide()] },
                  }))
                }
                className={developerSecondaryButtonClassName}
              >
                <Plus size={16} weight="bold" />
                Novo slide
              </button>
            }
          />
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void saveSection("hero", api.admin.homeHero, home.hero);
            }}
          >
            {home.hero.slides.length === 0 ? (
              <DeveloperMessage tone="info">Nenhum slide cadastrado. A Home oculta o hero ate existir um slide valido.</DeveloperMessage>
            ) : null}
            {home.hero.slides.map((slide, index) => (
              <HomeAccordionCard
                key={slide.id}
                label={`Slide ${index + 1}`}
                title={slide.title || "Slide sem titulo"}
                description="Mídia, textos e botões exibidos no carrossel principal da Home."
                active={slide.active !== false}
                open={openHeroSlide === index}
                onToggle={() => setOpenHeroSlide(openHeroSlide === index ? null : index)}
                actions={
                  <>
                  <button type="button" onClick={() => setHome((current) => ({ ...current, hero: { slides: moveItem(current.hero.slides, index, -1) } }))} className={developerGhostButtonClassName}>
                    <ArrowUp size={16} weight="bold" />
                    Subir
                  </button>
                  <button type="button" onClick={() => setHome((current) => ({ ...current, hero: { slides: moveItem(current.hero.slides, index, 1) } }))} className={developerGhostButtonClassName}>
                    <ArrowDown size={16} weight="bold" />
                    Descer
                  </button>
                  <button type="button" onClick={() => setHome((current) => ({ ...current, hero: { slides: current.hero.slides.filter((_, itemIndex) => itemIndex !== index) } }))} className={developerDangerButtonClassName}>
                    <Trash size={16} weight="bold" />
                    Remover
                  </button>
                  </>
                }
              >
                <div className={cn(homeNestedPanelClassName, "grid gap-5 lg:grid-cols-3")}>
                  <DeveloperField label="Modo de exibicao" required>
                    <select value={slide.mode} onChange={(event) => updateHeroSlide(index, { mode: event.target.value as HomeHeroMode })} className={developerInputClassName}>
                      <option value="text-media-buttons">Texto + mídia + botões</option>
                      <option value="text-media">Texto + mídia sem botões</option>
                      <option value="media-only">Somente mídia completa</option>
                    </select>
                  </DeveloperField>
                  <DeveloperField label="Título" required={slide.mode !== "media-only"} hint="Onde aparece: chamada principal do hero. Máximo esperado: 2 linhas.">
                    <input value={slide.title} onChange={(event) => updateHeroSlide(index, { title: event.target.value })} maxLength={120} className={developerInputClassName} />
                    <CountHint value={slide.title} maxLength={120} />
                  </DeveloperField>
                  <label className="flex min-h-10 items-center gap-3 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold">
                    <input type="checkbox" checked={slide.active !== false} onChange={(event) => updateHeroSlide(index, { active: event.target.checked })} className="h-4 w-4 accent-[var(--primary)]" />
                    Slide ativo
                  </label>
                </div>
                {slide.mode !== "media-only" ? (
                  <div className={cn(homeNestedPanelClassName, "mt-4")}>
                    <DeveloperField label="Descrição" required hint="Onde aparece: parágrafo abaixo do título. Máximo esperado: 3 linhas.">
                      <textarea value={slide.description} onChange={(event) => updateHeroSlide(index, { description: event.target.value })} maxLength={420} rows={3} className={`${developerInputClassName} resize-none`} />
                      <CountHint value={slide.description} maxLength={420} />
                    </DeveloperField>
                  </div>
                ) : null}
                <div className="mt-4">
                  <HomeMediaEditor label="Mídia do hero" media={slide.media} required onChange={(media) => updateHeroSlide(index, { media })} />
                </div>
                {slide.mode === "text-media-buttons" ? (
                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    {[0, 1].map((buttonIndex) => {
                      const button = slide.buttons[buttonIndex] ?? EMPTY_BUTTON;
                      const buttons = [...slide.buttons];
                      const updateButton = (patch: Partial<HomeHeroButton>) => {
                        buttons[buttonIndex] = { ...button, ...patch };
                        updateHeroSlide(index, { buttons });
                      };
                      return (
                        <div key={buttonIndex} className={homeNestedPanelClassName}>
                          <DeveloperSectionHeading title={`Botao ${buttonIndex + 1}`} description="Texto e link do CTA exibido sobre o hero." />
                          <div className="grid gap-5 sm:grid-cols-2">
                            <DeveloperField label="Texto">
                              <input value={button.label} onChange={(event) => updateButton({ label: event.target.value })} maxLength={40} className={developerInputClassName} />
                            </DeveloperField>
                            <DeveloperField label="Link">
                              <input value={button.url} onChange={(event) => updateButton({ url: event.target.value })} className={developerInputClassName} />
                            </DeveloperField>
                            <DeveloperColorField label="Cor" value={button.color || "#1d4ed8"} onChange={(color) => updateButton({ color })} />
                            <DeveloperField label="Visual">
                              <select value={button.variant ?? "solid"} onChange={(event) => updateButton({ variant: event.target.value as HomeHeroButton["variant"] })} className={developerInputClassName}>
                                <option value="solid">Solido</option>
                                <option value="outline">Outline</option>
                              </select>
                            </DeveloperField>
                          </div>
                          <label className="mt-4 flex min-h-10 items-center gap-3 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold">
                            <input type="checkbox" checked={button.enabled} onChange={(event) => updateButton({ enabled: event.target.checked })} className="h-4 w-4 accent-[var(--primary)]" />
                            Botao ativo
                          </label>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </HomeAccordionCard>
            ))}
            <SaveButton saving={saving === "hero"}>Salvar Hero</SaveButton>
          </form>
        </DeveloperCard>
        ) : null}

        {activeStep === "section1" ? (
        <DeveloperCard id="section-1" className="p-5 sm:p-6">
          <DeveloperSectionHeading
            eyebrow="Etapa 2 - primeira seção após o hero"
            title="Previsibilidade para crescer"
            description="Exatamente 3 itens clicáveis. A descrição é truncada visualmente em 2 linhas no site."
          />
          <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void saveSection("section1", api.admin.homeSection1, home.section1); }}>
            <div className={cn(homeFormGroupClassName, "grid gap-5 md:grid-cols-3")}>
              <DeveloperField label="Título principal" required hint="Onde aparece: topo da Seção 1. Máximo esperado: 2 linhas.">
                <input value={home.section1.title} onChange={(event) => setHome((current) => ({ ...current, section1: { ...current.section1, title: event.target.value } }))} maxLength={140} className={developerInputClassName} />
                <CountHint value={home.section1.title} maxLength={140} />
              </DeveloperField>
              <DeveloperField label="Texto do botão final" required>
                <input value={home.section1.ctaLabel} onChange={(event) => setHome((current) => ({ ...current, section1: { ...current.section1, ctaLabel: event.target.value } }))} maxLength={40} className={developerInputClassName} />
              </DeveloperField>
              <DeveloperField label="Link do botão final" required>
                <input value={home.section1.ctaUrl} onChange={(event) => setHome((current) => ({ ...current, section1: { ...current.section1, ctaUrl: event.target.value } }))} className={developerInputClassName} />
              </DeveloperField>
            </div>
            {home.section1.items.map((item, index) => (
              <HomeAccordionCard
                key={item.id}
                label={`Item ${index + 1}`}
                title={item.title || "Item clicavel sem titulo"}
                description="Ao clicar, troca a mídia exibida no lado esquerdo da seção."
                open={openSection1Item === index}
                onToggle={() => setOpenSection1Item(openSection1Item === index ? null : index)}
              >
                <div className={cn(homeNestedPanelClassName, "grid gap-5 md:grid-cols-2")}>
                  <DeveloperField label="Título curto" required hint="Limite forte: máximo 3 a 5 palavras.">
                    <input value={item.title} onChange={(event) => updateSection1Item(index, { title: event.target.value })} maxLength={60} className={developerInputClassName} />
                    <CountHint value={item.title} maxWords={5} maxLength={60} />
                  </DeveloperField>
                  <DeveloperField label="Descrição curta" required hint="No site será cortada com reticências se passar de 2 linhas.">
                    <textarea value={item.description} onChange={(event) => updateSection1Item(index, { description: event.target.value })} maxLength={180} rows={3} className={`${developerInputClassName} resize-none`} />
                    <CountHint value={item.description} maxLength={180} />
                  </DeveloperField>
                </div>
                <div className="mt-4">
                  <HomeMediaEditor label={`Mídia do item ${index + 1}`} media={item.media} required onChange={(media) => updateSection1Item(index, { media })} />
                </div>
              </HomeAccordionCard>
            ))}
            <SaveButton saving={saving === "section1"}>Salvar Seção 1</SaveButton>
          </form>
        </DeveloperCard>
        ) : null}

        {activeStep === "section2" ? (
        <DeveloperCard id="section-2" className="p-5 sm:p-6">
          <DeveloperSectionHeading
            eyebrow="Etapa 3 - área de operação"
            title="Todas as frentes da operação se encontram aqui"
            description="Máximo de 5 itens. A ordem aqui define a ordem desktop e mobile."
            action={
              <button
                type="button"
                disabled={home.section2.items.length >= 5}
                onClick={() => setHome((current) => ({ ...current, section2: { ...current.section2, items: [...current.section2.items, emptySection2Item()] } }))}
                className={developerSecondaryButtonClassName}
              >
                <Plus size={16} weight="bold" />
                Novo item
              </button>
            }
          />
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void saveSection("section2", api.admin.homeSection2, home.section2); }}>
            <div className={homeFormGroupClassName}>
              <DeveloperField label="Título principal" required hint="Onde aparece: título da faixa escura da Seção 2.">
                <input value={home.section2.title} onChange={(event) => setHome((current) => ({ ...current, section2: { ...current.section2, title: event.target.value } }))} maxLength={160} className={developerInputClassName} />
                <CountHint value={home.section2.title} maxLength={160} />
              </DeveloperField>
            </div>
            {home.section2.items.map((item, index) => (
              <HomeAccordionCard
                key={item.id}
                label={`Item ${index + 1}`}
                title={item.title || "Item sem titulo"}
                description="Título e descrição aparecem sobre a mídia no card ativo."
                active={item.active !== false}
                open={openSection2Item === index}
                onToggle={() => setOpenSection2Item(openSection2Item === index ? null : index)}
                actions={
                  <>
                  <button type="button" onClick={() => setHome((current) => ({ ...current, section2: { ...current.section2, items: moveItem(current.section2.items, index, -1) } }))} className={developerGhostButtonClassName}><ArrowUp size={16} weight="bold" />Subir</button>
                  <button type="button" onClick={() => setHome((current) => ({ ...current, section2: { ...current.section2, items: moveItem(current.section2.items, index, 1) } }))} className={developerGhostButtonClassName}><ArrowDown size={16} weight="bold" />Descer</button>
                  <button type="button" onClick={() => setHome((current) => ({ ...current, section2: { ...current.section2, items: current.section2.items.filter((_, itemIndex) => itemIndex !== index) } }))} className={developerDangerButtonClassName}><Trash size={16} weight="bold" />Remover</button>
                  </>
                }
              >
                <div className={cn(homeNestedPanelClassName, "grid gap-5 md:grid-cols-2")}>
                  <DeveloperField label="Título" required hint="Máximo esperado: 3 linhas.">
                    <input value={item.title} onChange={(event) => updateSection2Item(index, { title: event.target.value })} maxLength={120} className={developerInputClassName} />
                    <CountHint value={item.title} maxLength={120} />
                  </DeveloperField>
                  <DeveloperField label="Descrição" required hint="Máximo esperado: 3 linhas.">
                    <textarea value={item.description} onChange={(event) => updateSection2Item(index, { description: event.target.value })} maxLength={260} rows={3} className={`${developerInputClassName} resize-none`} />
                    <CountHint value={item.description} maxLength={260} />
                  </DeveloperField>
                </div>
                <label className="my-4 flex min-h-10 items-center gap-3 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold">
                  <input type="checkbox" checked={item.active !== false} onChange={(event) => updateSection2Item(index, { active: event.target.checked })} className="h-4 w-4 accent-[var(--primary)]" />
                  Item ativo
                </label>
                <HomeMediaEditor label={`Mídia do item ${index + 1}`} media={item.media} required onChange={(media) => updateSection2Item(index, { media })} />
              </HomeAccordionCard>
            ))}
            <SaveButton saving={saving === "section2"}>Salvar Seção 2</SaveButton>
          </form>
        </DeveloperCard>
        ) : null}

        {activeStep === "section3" ? (
        <DeveloperCard id="section-3" className="p-5 sm:p-6">
          <DeveloperSectionHeading
            eyebrow="Etapa 4 - linhas de servico"
            title="Soluções para a complexidade da sua operação"
            description="O site mostra 3 cards por página, com paginação visual e rotação automática."
            action={
              <button type="button" onClick={addSection3Card} className={developerSecondaryButtonClassName}>
                <Plus size={16} weight="bold" />
                Novo card
              </button>
            }
          />
          <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void saveSection("section3", api.admin.homeSection3, home.section3); }}>
            <div className={cn(homeFormGroupClassName, "space-y-5")}>
              <div className="grid gap-5 xl:grid-cols-[minmax(140px,190px)_minmax(260px,1.2fr)_minmax(160px,220px)_minmax(220px,1fr)]">
                <DeveloperField label="Badge" required>
                  <input value={home.section3.badge} onChange={(event) => setHome((current) => ({ ...current, section3: { ...current.section3, badge: event.target.value } }))} maxLength={60} className={developerInputClassName} />
                </DeveloperField>
                <DeveloperField label="Título principal" required hint="Máximo esperado: 3 linhas.">
                  <input value={home.section3.title} onChange={(event) => setHome((current) => ({ ...current, section3: { ...current.section3, title: event.target.value } }))} maxLength={180} className={developerInputClassName} />
                  <CountHint value={home.section3.title} maxLength={180} />
                </DeveloperField>
                <DeveloperField label="Texto do botão" required>
                  <input value={home.section3.ctaLabel} onChange={(event) => setHome((current) => ({ ...current, section3: { ...current.section3, ctaLabel: event.target.value } }))} maxLength={40} className={developerInputClassName} />
                </DeveloperField>
                <DeveloperField label="Link do botão" required>
                  <input value={home.section3.ctaUrl} onChange={(event) => setHome((current) => ({ ...current, section3: { ...current.section3, ctaUrl: event.target.value } }))} className={developerInputClassName} />
                </DeveloperField>
              </div>
              <DeveloperField label="Descrição principal" required hint="Máximo esperado: 4 linhas.">
                <textarea value={home.section3.description} onChange={(event) => setHome((current) => ({ ...current, section3: { ...current.section3, description: event.target.value } }))} maxLength={420} rows={4} className={`${developerInputClassName} resize-none`} />
                <CountHint value={home.section3.description} maxLength={420} />
              </DeveloperField>
            </div>
            {home.section3.cards.map((card, index) => (
              <HomeAccordionCard
                key={card.id}
                label={`Card ${index + 1}`}
                title={card.title || "Card fixo sem titulo"}
                description="Card da Seção 3. O título tem limite forte de 2 palavras."
                open={openSection3Card === index}
                onToggle={() => setOpenSection3Card(openSection3Card === index ? null : index)}
                actions={
                  <>
                    <button type="button" onClick={() => setHome((current) => ({ ...current, section3: { ...current.section3, cards: moveItem(current.section3.cards, index, -1) } }))} className={developerGhostButtonClassName}><ArrowUp size={16} weight="bold" />Subir</button>
                    <button type="button" onClick={() => setHome((current) => ({ ...current, section3: { ...current.section3, cards: moveItem(current.section3.cards, index, 1) } }))} className={developerGhostButtonClassName}><ArrowDown size={16} weight="bold" />Descer</button>
                    <button type="button" onClick={() => removeSection3Card(index)} className={developerDangerButtonClassName}><Trash size={16} weight="bold" />Remover</button>
                  </>
                }
              >
                <div className={cn(homeNestedPanelClassName, "grid gap-5 md:grid-cols-3")}>
                  <DeveloperField label="Badge pequeno" required>
                    <input value={card.badge} onChange={(event) => updateSection3Card(index, { badge: event.target.value })} maxLength={60} className={developerInputClassName} />
                  </DeveloperField>
                  <DeveloperField label="Título do card" required>
                    <input value={card.title} onChange={(event) => updateSection3Card(index, { title: event.target.value })} maxLength={80} className={developerInputClassName} />
                    <CountHint value={card.title} maxWords={2} maxLength={80} />
                  </DeveloperField>
                  <DeveloperField label="Texto do botão interno" required>
                    <input value={card.ctaLabel} onChange={(event) => updateSection3Card(index, { ctaLabel: event.target.value })} maxLength={40} className={developerInputClassName} />
                  </DeveloperField>
                </div>
                <div className={cn(homeNestedPanelClassName, "mt-4 grid gap-5 md:grid-cols-2")}>
                  <DeveloperField label="Descrição do card" required hint="Máximo esperado: 5 linhas.">
                    <textarea value={card.description} onChange={(event) => updateSection3Card(index, { description: event.target.value })} maxLength={320} rows={4} className={`${developerInputClassName} resize-none`} />
                    <CountHint value={card.description} maxLength={320} />
                  </DeveloperField>
                  <DeveloperField label="Link do botão interno" required>
                    <input value={card.ctaUrl} onChange={(event) => updateSection3Card(index, { ctaUrl: event.target.value })} className={developerInputClassName} />
                  </DeveloperField>
                </div>
                <div className="mt-4">
                  <HomeMediaEditor label={`Mídia do card ${index + 1}`} media={card.media} required onChange={(media) => updateSection3Card(index, { media })} />
                </div>
              </HomeAccordionCard>
            ))}
            <SaveButton saving={saving === "section3"}>Salvar Seção 3</SaveButton>
          </form>
        </DeveloperCard>
        ) : null}

        {activeStep === "regionalPresence" ? (
        <DeveloperCard id="regional-presence" className="p-5 sm:p-6">
          <DeveloperSectionHeading
            eyebrow="Etapa 5 - Presença Regional"
            title="Unidades exibidas na Página Inicial"
            description="Cada card é salvo dentro da Home. A lista antiga de unidades serve apenas como referência para preencher campos."
            action={
              <button type="button" onClick={addRegionalUnit} className={developerSecondaryButtonClassName}>
                <Plus size={16} weight="bold" />
                Adicionar unidade
              </button>
            }
          />
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void saveSection("regionalPresence", api.admin.homeRegionalPresence, home.regionalPresence);
            }}
          >
            {home.regionalPresence.units.length === 0 ? (
              <DeveloperMessage tone="info">
                Nenhuma unidade cadastrada para a Home. Adicione a primeira unidade para exibir a seção no site.
              </DeveloperMessage>
            ) : null}

            {home.regionalPresence.units.length > 0 ? (
              <div className="overflow-x-auto pb-1">
                <div className="flex min-w-max gap-2">
                  {home.regionalPresence.units.map((unit, index) => (
                    <button
                      key={unit.id}
                      type="button"
                      onClick={() => setActiveRegionalUnit(index)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-xs font-bold transition-all",
                        activeRegionalUnit === index
                          ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-[0_10px_22px_rgba(29,78,216,0.18)]"
                          : "border-slate-200 bg-white text-slate-600 hover:border-[var(--primary)]/30 hover:text-[var(--primary)]"
                      )}
                    >
                      Unidade {index + 1}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {home.regionalPresence.units.map((unit, index) =>
              activeRegionalUnit === index ? (
                <div key={unit.id} className={homeEditableCardClassName(unit.active !== false)}>
                  <HomeItemHeader
                    label={`Unidade ${index + 1}`}
                    title={unit.name || "Unidade sem nome"}
                    description={unit.description || "Card da seção Presença Regional."}
                    active={unit.active !== false}
                    actions={
                      <>
                        <button
                          type="button"
                          onClick={() => setHome((current) => ({ ...current, regionalPresence: { units: moveItem(current.regionalPresence.units, index, -1) } }))}
                          className={developerGhostButtonClassName}
                        >
                          <ArrowUp size={16} weight="bold" />
                          Subir
                        </button>
                        <button
                          type="button"
                          onClick={() => setHome((current) => ({ ...current, regionalPresence: { units: moveItem(current.regionalPresence.units, index, 1) } }))}
                          className={developerGhostButtonClassName}
                        >
                          <ArrowDown size={16} weight="bold" />
                          Descer
                        </button>
                        <button type="button" onClick={() => removeRegionalUnit(index)} className={developerDangerButtonClassName}>
                          <Trash size={16} weight="bold" />
                          Remover
                        </button>
                      </>
                    }
                  />

                  <div className={cn(homeNestedPanelClassName, "grid gap-5 lg:grid-cols-3")}>
                    <DeveloperField label="Vínculo com unidade cadastrada" hint="Opcional. Ao selecionar, os campos principais são preenchidos como ponto de partida.">
                      <select
                        value={unit.linkedUnitId ?? ""}
                        onChange={(event) => applyLinkedUnit(index, event.target.value)}
                        className={developerInputClassName}
                      >
                        <option value="">Sem vínculo</option>
                        {availableUnits.map((availableUnit) => (
                          <option key={availableUnit.id} value={availableUnit.id}>
                            {availableUnit.name} - {(availableUnit.state || "").toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </DeveloperField>
                    <DeveloperField label="Nome da unidade" required>
                      <input
                        value={unit.name}
                        onChange={(event) => updateRegionalUnit(index, { name: event.target.value })}
                        maxLength={90}
                        className={developerInputClassName}
                        placeholder="Matriz Agudos"
                      />
                    </DeveloperField>
                    <DeveloperField label="UF" required>
                      <select
                        value={(unit.state || "SP").toUpperCase()}
                        onChange={(event) => updateRegionalUnit(index, { state: event.target.value })}
                        className={developerInputClassName}
                      >
                        {BRAZIL_UFS.map((uf) => (
                          <option key={uf} value={uf}>
                            {uf}
                          </option>
                        ))}
                      </select>
                    </DeveloperField>
                  </div>

                  <div className={cn(homeNestedPanelClassName, "mt-4 grid gap-5 lg:grid-cols-2")}>
                    <DeveloperField label="Descrição curta" required hint="Máximo recomendado: 2 linhas.">
                      <textarea
                        value={unit.description}
                        onChange={(event) => updateRegionalUnit(index, { description: event.target.value })}
                        maxLength={220}
                        rows={2}
                        className={`${developerInputClassName} resize-none`}
                        placeholder="Base central"
                      />
                      <CountHint value={unit.description} maxLength={220} />
                    </DeveloperField>
                    <DeveloperField label="Endereço" required>
                      <textarea
                        value={unit.address}
                        onChange={(event) => updateRegionalUnit(index, { address: event.target.value })}
                        maxLength={220}
                        rows={2}
                        className={`${developerInputClassName} resize-none`}
                      />
                    </DeveloperField>
                  </div>

                  <div className={cn(homeNestedPanelClassName, "mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-4")}>
                    <DeveloperField label="Telefone">
                      <input
                        value={unit.phone}
                        onChange={(event) => updateRegionalUnit(index, { phone: event.target.value })}
                        maxLength={60}
                        className={developerInputClassName}
                      />
                    </DeveloperField>
                    <DeveloperField label="E-mail">
                      <input
                        type="email"
                        value={unit.email}
                        onChange={(event) => updateRegionalUnit(index, { email: event.target.value })}
                        maxLength={120}
                        className={developerInputClassName}
                      />
                    </DeveloperField>
                    <DeveloperField label="Texto do botão">
                      <input
                        value={unit.buttonLabel ?? ""}
                        onChange={(event) => updateRegionalUnit(index, { buttonLabel: event.target.value })}
                        maxLength={40}
                        className={developerInputClassName}
                      />
                    </DeveloperField>
                    <DeveloperField label="Link do botão" required>
                      <input
                        value={unit.contactUrl}
                        onChange={(event) => updateRegionalUnit(index, { contactUrl: event.target.value })}
                        className={developerInputClassName}
                        placeholder="/fale-conosco"
                      />
                    </DeveloperField>
                  </div>

                  <label className="mt-4 flex min-h-10 items-center gap-3 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={unit.active !== false}
                      onChange={(event) => updateRegionalUnit(index, { active: event.target.checked })}
                      className="h-4 w-4 accent-[var(--primary)]"
                    />
                    Unidade ativa no site
                  </label>
                </div>
              ) : null
            )}

            <SaveButton saving={saving === "regionalPresence"}>Salvar Presença Regional</SaveButton>
          </form>
        </DeveloperCard>
        ) : null}

        {activeStep === "trackingCta" ? (
        <DeveloperCard id="tracking-cta" className="p-5 sm:p-6">
          <DeveloperSectionHeading
            eyebrow="Etapa 6 - Rastreie sua carga"
            title="Botões da seção de rastreio"
            description="Edite somente texto e link dos dois botões exibidos na Página Inicial."
          />
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void saveSection("trackingCta", api.admin.homeTrackingCta, home.trackingCta);
            }}
          >
            <div className="grid gap-5 lg:grid-cols-2">
              {normalizeTrackingButtons(home.trackingCta.buttons).map((button, index) => (
                <div key={index} className={homeEditableCardClassName(button.enabled !== false)}>
                  <HomeItemHeader
                    label={`Botão ${index + 1}`}
                    title={button.label || `Botão ${index + 1}`}
                    description={index === 0 ? "Botão principal de acesso ao rastreio." : "Botão secundário de orientação."}
                    active={button.enabled !== false}
                  />
                  <div className={cn(homeNestedPanelClassName, "grid gap-5 sm:grid-cols-2")}>
                    <DeveloperField label="Texto do botão" required>
                      <input
                        value={button.label}
                        onChange={(event) => updateTrackingButton(index, { label: event.target.value })}
                        maxLength={40}
                        className={developerInputClassName}
                      />
                    </DeveloperField>
                    <DeveloperField label="Link do botão" required>
                      <input
                        value={button.url}
                        onChange={(event) => updateTrackingButton(index, { url: event.target.value })}
                        className={developerInputClassName}
                      />
                    </DeveloperField>
                  </div>
                  <label className="mt-4 flex min-h-10 items-center gap-3 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={button.enabled !== false}
                      onChange={(event) => updateTrackingButton(index, { enabled: event.target.checked })}
                      className="h-4 w-4 accent-[var(--primary)]"
                    />
                    Botão ativo
                  </label>
                </div>
              ))}
            </div>
            <SaveButton saving={saving === "trackingCta"}>Salvar botões de rastreio</SaveButton>
          </form>
        </DeveloperCard>
        ) : null}

        {activeStep === "socialProof" ? (
        <DeveloperCard id="social-proof" className="p-5 sm:p-6">
          <DeveloperSectionHeading
            eyebrow="Etapa 5 - carrossel de depoimentos"
            title="Prova Social da Home"
            description="Lista livre de feedbacks. A ordem aqui e a ordem exibida no carrossel da Home."
            action={
              <button type="button" onClick={() => setHome((current) => ({ ...current, socialProof: { ...current.socialProof, feedbacks: [...current.socialProof.feedbacks, emptyFeedback()] } }))} className={developerSecondaryButtonClassName}>
                <Plus size={16} weight="bold" />
                Novo feedback
              </button>
            }
          />
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void saveSection("socialProof", api.admin.homeSocialProof, home.socialProof); }}>
            <div className={homeFormGroupClassName}>
              <DeveloperField label="Título principal" required hint="Onde aparece: topo da Prova Social. Máximo esperado: 2 linhas.">
                <input value={home.socialProof.title} onChange={(event) => setHome((current) => ({ ...current, socialProof: { ...current.socialProof, title: event.target.value } }))} maxLength={160} className={developerInputClassName} />
                <CountHint value={home.socialProof.title} maxLength={160} />
              </DeveloperField>
            </div>
            {home.socialProof.feedbacks.map((feedback, index) => (
              <HomeAccordionCard
                key={feedback.id}
                label={`Feedback ${index + 1}`}
                title={feedback.name || "Feedback sem nome"}
                description="Foto/logo, depoimento, empresa e avaliacao exibidos no card."
                active={feedback.active !== false}
                open={openFeedback === index}
                onToggle={() => setOpenFeedback(openFeedback === index ? null : index)}
                actions={
                  <>
                  <button type="button" onClick={() => setHome((current) => ({ ...current, socialProof: { ...current.socialProof, feedbacks: moveItem(current.socialProof.feedbacks, index, -1) } }))} className={developerGhostButtonClassName}><ArrowUp size={16} weight="bold" />Subir</button>
                  <button type="button" onClick={() => setHome((current) => ({ ...current, socialProof: { ...current.socialProof, feedbacks: moveItem(current.socialProof.feedbacks, index, 1) } }))} className={developerGhostButtonClassName}><ArrowDown size={16} weight="bold" />Descer</button>
                  <button type="button" onClick={() => setHome((current) => ({ ...current, socialProof: { ...current.socialProof, feedbacks: current.socialProof.feedbacks.filter((_, feedbackIndex) => feedbackIndex !== index) } }))} className={developerDangerButtonClassName}><Trash size={16} weight="bold" />Excluir</button>
                  </>
                }
              >
                <div className={cn(homeNestedPanelClassName, "grid gap-5 md:grid-cols-4")}>
                  <DeveloperField label="Nome" required hint="Normalmente, nome da empresa.">
                    <input value={feedback.name} onChange={(event) => updateFeedback(index, { name: event.target.value })} maxLength={80} className={developerInputClassName} />
                  </DeveloperField>
                  <DeveloperField label="Cargo/descrição" required>
                    <input value={feedback.role} onChange={(event) => updateFeedback(index, { role: event.target.value })} maxLength={80} className={developerInputClassName} />
                  </DeveloperField>
                  <DeveloperField label="Empresa" required>
                    <input value={feedback.company} onChange={(event) => updateFeedback(index, { company: event.target.value })} maxLength={120} className={developerInputClassName} />
                  </DeveloperField>
                  <DeveloperField label="Estrelas" required>
                    <input type="number" min={1} max={5} value={feedback.rating} onChange={(event) => updateFeedback(index, { rating: Math.min(5, Math.max(1, Number(event.target.value) || 1)) })} className={developerInputClassName} />
                  </DeveloperField>
                </div>
                <div className={cn(homeNestedPanelClassName, "mt-4 grid gap-5")}>
                  <DeveloperField label="Depoimento" required>
                    <textarea value={feedback.testimonial} onChange={(event) => updateFeedback(index, { testimonial: event.target.value })} maxLength={800} rows={5} className={`${developerInputClassName} resize-none`} />
                    <CountHint value={feedback.testimonial} maxLength={800} />
                  </DeveloperField>
                  <DeveloperMediaField label="Foto ou logo" required mediaType="image" value={feedback.photo} onChange={(photo) => updateFeedback(index, { photo })} previewAlt={feedback.name} />
                </div>
                <label className="mt-4 flex min-h-10 items-center gap-3 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold">
                  <input type="checkbox" checked={feedback.active !== false} onChange={(event) => updateFeedback(index, { active: event.target.checked })} className="h-4 w-4 accent-[var(--primary)]" />
                  Feedback ativo
                </label>
              </HomeAccordionCard>
            ))}
            <SaveButton saving={saving === "socialProof"}>Salvar Prova Social</SaveButton>
          </form>
        </DeveloperCard>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-[var(--border)] bg-white/82 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.045)]">
        <button
          type="button"
          onClick={() => moveStep(-1)}
          disabled={activeStepIndex === 0}
          className={cn(
            developerSecondaryButtonClassName,
            "rounded-full px-5 disabled:cursor-not-allowed disabled:opacity-45"
          )}
        >
          <CaretLeft size={16} weight="bold" />
          Anterior
        </button>
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-raw)]">
          Pagina {activeStepIndex + 1} de {HOME_STEPS.length}
        </span>
        <button
          type="button"
          onClick={() => moveStep(1)}
          disabled={activeStepIndex === HOME_STEPS.length - 1}
          className={cn(
            developerSecondaryButtonClassName,
            "rounded-full px-5 disabled:cursor-not-allowed disabled:opacity-45"
          )}
        >
          Proximo
          <CaretRight size={16} weight="bold" />
        </button>
      </div>
    </DeveloperPage>
  );
}

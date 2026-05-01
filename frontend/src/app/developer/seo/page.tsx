"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle, MagnifyingGlass, Pulse } from "@phosphor-icons/react";
import { DeveloperImageField } from "@/components/developer/DeveloperImageField";
import {
  DeveloperCard,
  DeveloperField,
  DeveloperHero,
  DeveloperMessage,
  DeveloperPage,
  DeveloperSectionHeading,
  DeveloperTooltip,
  developerInputClassName,
  developerPrimaryButtonClassName,
  developerSecondaryButtonClassName,
} from "@/components/developer/ui";
import { useApiRequest } from "@/hooks/useApiRequest";
import {
  adminResourceKeys,
  invalidateAdminResource,
  useAdminResource,
} from "@/hooks/useAdminResource";
import { api } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface SeoPageSettings {
  path: string;
  label: string;
  title: string;
  description: string;
  metaTags: string;
  index: boolean;
  follow: boolean;
  canonical: string;
  slug: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  updatedAt?: string;
}

const EMPTY_PAGE: SeoPageSettings = {
  path: "/",
  label: "Home",
  title: "",
  description: "",
  metaTags: "",
  index: true,
  follow: true,
  canonical: "/",
  slug: "/",
  ogTitle: "",
  ogDescription: "",
  ogImage: "/foto5.png",
};

function scoreSeo(page: SeoPageSettings) {
  let score = 0;
  if (page.title.length >= 30 && page.title.length <= 70) score += 25;
  if (page.description.length >= 80 && page.description.length <= 160) score += 25;
  if (page.canonical) score += 15;
  if (page.ogTitle && page.ogDescription && page.ogImage) score += 25;
  if (page.index && page.follow) score += 10;
  return score;
}

export default function SeoPage() {
  const { apiRequest } = useApiRequest();
  const [selectedPath, setSelectedPath] = useState("/");
  const [form, setForm] = useState<SeoPageSettings>(EMPTY_PAGE);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"" | "success" | "error">("");
  const [message, setMessage] = useState("");

  const { data, loading, error, refresh } = useAdminResource<{
    pages: SeoPageSettings[];
    updatedAt?: string;
  }>({
    key: adminResourceKeys.seo,
    fetcher: async (request) => {
      const response = await request<{ pages?: SeoPageSettings[]; updatedAt?: string }>(
        api.admin.seoSettings
      );
      if (!response.success) {
        return { success: false, error: response.error ?? "Falha ao carregar SEO." };
      }
      return {
        success: true,
        data: { pages: response.data?.pages ?? [], updatedAt: response.data?.updatedAt },
      };
    },
  });

  const pages = data?.pages ?? [];
  const selectedPage = useMemo(
    () => pages.find((page) => page.path === selectedPath) ?? pages[0] ?? EMPTY_PAGE,
    [pages, selectedPath]
  );
  const avgScore = pages.length
    ? Math.round(pages.reduce((sum, page) => sum + scoreSeo(page), 0) / pages.length)
    : 0;

  useEffect(() => {
    setForm(selectedPage);
  }, [selectedPage]);

  async function handleSave() {
    setSaving(true);
    setStatus("");
    setMessage("");
    const response = await apiRequest(api.admin.seoSettings, {
      method: "POST",
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!response.success) {
      setStatus("error");
      setMessage(response.error ?? "Falha ao salvar SEO.");
      return;
    }
    invalidateAdminResource([adminResourceKeys.seo, adminResourceKeys.dashboard]);
    setStatus("success");
    setMessage("Configuração de SEO salva com sucesso.");
    await refresh();
  }

  function setValue<K extends keyof SeoPageSettings>(key: K, value: SeoPageSettings[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <DeveloperPage>
      <DeveloperHero
        eyebrow="SEO"
        title="Controle de metadados por página."
        description="Edite títulos, descrições, indexação, canonical e preview social sem alterar código."
        stats={[
          { label: "Páginas", value: pages.length },
          { label: "Score médio", value: `${avgScore}%` },
          { label: "Noindex", value: pages.filter((page) => !page.index).length },
        ]}
      />

      {loading ? <DeveloperMessage tone="info">Carregando SEO...</DeveloperMessage> : null}
      {error ? <DeveloperMessage tone="error">{error}</DeveloperMessage> : null}
      {status ? (
        <div className="mt-4">
          <DeveloperMessage tone={status === "success" ? "success" : "error"}>{message}</DeveloperMessage>
        </div>
      ) : null}

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.15fr)]">
        <DeveloperCard>
          <DeveloperSectionHeading
            eyebrow="Rotas"
            title="Páginas publicadas"
            description="Selecione uma rota conhecida para editar os metadados."
            tooltip="Rota é o endereço da página no site. Exemplos: /sobre, /contato, /servicos."
          />
          <div className="space-y-2">
            {pages.map((page) => {
              const score = scoreSeo(page);
              return (
                <button
                  key={page.path}
                  type="button"
                  onClick={() => setSelectedPath(page.path)}
                  className={cn(
                    "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border px-3 py-2 text-left transition",
                    selectedPath === page.path
                      ? "border-[var(--primary)] bg-[var(--primary)]/8"
                      : "border-[var(--border)] bg-white/76 hover:bg-white"
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[var(--foreground)]">
                      {page.label}
                    </span>
                  <span className="block truncate text-xs text-[var(--color-muted-raw)]">
                    {page.path}
                  </span>
                  </span>
                  <span
                    className={cn(
                      "rounded-md px-2 py-1 text-xs font-bold",
                      score >= 80
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-amber-500/10 text-amber-600"
                    )}
                  >
                    {score}%
                  </span>
                </button>
              );
            })}
          </div>
        </DeveloperCard>

        <DeveloperCard>
          <DeveloperSectionHeading
            eyebrow="Editor"
            title={form.label || form.path}
            description="As validações ajudam a manter os snippets objetivos."
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <DeveloperField
              label="Título SEO"
              tooltip="Título que aparece no Google e na aba do navegador. Ex.: Serviços | Rodogarcia Transportes."
            >
              <input
                value={form.title}
                maxLength={90}
                onChange={(event) => setValue("title", event.target.value)}
                className={developerInputClassName}
              />
            </DeveloperField>
            <DeveloperField
              label="Canonical"
              tooltip="URL principal que os buscadores devem considerar. Ex.: /sobre evita conteúdo duplicado."
            >
              <input
                value={form.canonical}
                onChange={(event) => setValue("canonical", event.target.value)}
                className={developerInputClassName}
              />
            </DeveloperField>
          </div>

          <div className="mt-4">
            <DeveloperField
              label="Descrição SEO"
              tooltip="Resumo exibido nos resultados de busca. Ex.: explique a página em até 160 caracteres."
            >
              <textarea
                rows={3}
                value={form.description}
                maxLength={180}
                onChange={(event) => setValue("description", event.target.value)}
                className={`${developerInputClassName} resize-none`}
              />
            </DeveloperField>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white/76 px-3 py-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.index}
                onChange={(event) => setValue("index", event.target.checked)}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              <span className="inline-flex items-center gap-1.5">
                Indexar
                <DeveloperTooltip content="Quando ativo, permite que buscadores exibam esta página. Desative para páginas internas ou temporárias." />
              </span>
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white/76 px-3 py-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.follow}
                onChange={(event) => setValue("follow", event.target.checked)}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              <span className="inline-flex items-center gap-1.5">
                Follow
                <DeveloperTooltip content="Quando ativo, permite que buscadores sigam links desta página. Exemplo: use junto com Indexar em páginas públicas." />
              </span>
            </label>
            <DeveloperField
              label="Slug / rota"
              tooltip="Caminho público da página. Ex.: /sobre ou /servicos."
            >
              <input
                value={form.slug}
                onChange={(event) => setValue("slug", event.target.value)}
                className={developerInputClassName}
              />
            </DeveloperField>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <DeveloperField
              label="OG Title"
              tooltip="Título usado em previews de redes sociais. Ex.: Conheça a Rodogarcia."
            >
              <input
                value={form.ogTitle}
                onChange={(event) => setValue("ogTitle", event.target.value)}
                className={developerInputClassName}
              />
            </DeveloperField>
            <DeveloperImageField
              label="OG Image"
              hint="Imagem usada quando a página é compartilhada."
              tooltip="Imagem do preview social. Ex.: /uploads/capa-servicos.webp."
              value={form.ogImage}
              onChange={(value) => setValue("ogImage", value)}
            />
          </div>

          <div className="mt-4">
            <DeveloperField
              label="OG Description"
              tooltip="Descrição usada no card de redes sociais. Ex.: resumo curto da página para WhatsApp e LinkedIn."
            >
              <textarea
                rows={2}
                value={form.ogDescription}
                onChange={(event) => setValue("ogDescription", event.target.value)}
                className={`${developerInputClassName} resize-none`}
              />
            </DeveloperField>
          </div>

          <div className="mt-4">
            <DeveloperField
              label="Meta tags extras"
              hint="Uma por linha no formato nome=valor."
              tooltip="Metadados adicionais avançados. Ex.: theme-color=#ffffff."
            >
              <textarea
                rows={3}
                value={form.metaTags}
                onChange={(event) => setValue("metaTags", event.target.value)}
                className={`${developerInputClassName} resize-none`}
                placeholder="theme-color=#ffffff"
              />
            </DeveloperField>
          </div>

          <div className="mt-5 rounded-lg border border-[var(--border)] bg-slate-950 p-4 text-white">
            <div className="flex items-start gap-3">
              <MagnifyingGlass size={18} weight="bold" className="mt-1 text-sky-300" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{form.ogTitle || form.title}</p>
                <p className="mt-1 truncate text-xs text-sky-200">{form.canonical}</p>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">
                  {form.ogDescription || form.description}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={developerPrimaryButtonClassName}
            >
              <CheckCircle size={18} weight="bold" />
              {saving ? "Salvando..." : "Salvar configuração"}
            </button>
            <button
              type="button"
              onClick={() => void refresh()}
              className={developerSecondaryButtonClassName}
            >
              <Pulse size={16} weight="bold" />
              Atualizar dados
            </button>
          </div>
        </DeveloperCard>
      </section>
    </DeveloperPage>
  );
}

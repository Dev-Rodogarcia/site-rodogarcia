"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowSquareOut, CheckCircle } from "@phosphor-icons/react";
import { useApiRequest } from "@/hooks/useApiRequest";
import {
  adminResourceKeys,
  invalidateAdminResource,
  useAdminResource,
} from "@/hooks/useAdminResource";
import { api, site } from "@/lib/routes";
import { getAboutSiteTexts, type AboutSiteTexts } from "@/lib/siteTexts";
import {
  DeveloperCard,
  DeveloperField,
  DeveloperHero,
  DeveloperMessage,
  DeveloperPage,
  DeveloperSectionHeading,
  developerInputClassName,
  developerPrimaryButtonClassName,
  developerSecondaryButtonClassName,
} from "@/components/developer/ui";

export default function SobreHeroPage() {
  const { apiRequest } = useApiRequest();
  const [form, setForm] = useState<AboutSiteTexts>(getAboutSiteTexts());
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"" | "success" | "error">("");
  const [statusMessage, setStatusMessage] = useState("");
  const { data, loading, error, refresh } = useAdminResource<AboutSiteTexts>({
    key: adminResourceKeys.aboutHero,
    fetcher: async (request) => {
      const response = await request<{ siteTexts?: Record<string, string> }>(
        api.admin.siteTexts
      );

      if (!response.success) {
        return {
          success: false,
          error: response.error ?? "Falha ao carregar o hero.",
        };
      }

      return {
        success: true,
        data: getAboutSiteTexts(response.data?.siteTexts),
      };
    },
  });

  useEffect(() => {
    if (!data) return;
    setForm(data);
  }, [data]);

  const filledFields = useMemo(
    () =>
      [
        form.tag,
        form.title,
        form.subtitle,
        form.image,
        ...form.stats.flatMap((item) => [item.number, item.description]),
      ].filter((value) => String(value).trim().length > 0).length,
    [form]
  );

  async function handleSave() {
    setSaving(true);
    setStatus("");
    setStatusMessage("");

    const response = await apiRequest(api.admin.siteTexts, {
      method: "POST",
      body: JSON.stringify({
        aboutHeroTag: form.tag,
        aboutHeroTitle: form.title,
        aboutHeroSubtitle: form.subtitle,
        aboutHeroImage: form.image,
        aboutStat1Number: form.stats[0]?.number ?? "",
        aboutStat1Description: form.stats[0]?.description ?? "",
        aboutStat2Number: form.stats[1]?.number ?? "",
        aboutStat2Description: form.stats[1]?.description ?? "",
        aboutStat3Number: form.stats[2]?.number ?? "",
        aboutStat3Description: form.stats[2]?.description ?? "",
      }),
    });

    setSaving(false);

    if (!response.success) {
      setStatus("error");
      setStatusMessage(response.error ?? "Falha ao salvar o hero.");
      return;
    }

    invalidateAdminResource([adminResourceKeys.aboutHero, adminResourceKeys.dashboard]);
    setStatus("success");
    setStatusMessage("Hero da pagina sobre salvo com sucesso.");
    await refresh();
  }

  function setStat(index: number, key: "number" | "description", value: string) {
    setForm((current) => ({
      ...current,
      stats: current.stats.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      ),
    }));
  }

  return (
    <DeveloperPage>
      <DeveloperHero
        eyebrow="Conteudo - Sobre"
        title="Hero institucional e numeros da pagina sobre."
        description="A configuracao reaproveita o contrato antigo de site texts, agora refletido na pagina React atual."
        stats={[
          { label: "Campos preenchidos", value: `${filledFields}/10` },
          { label: "Indicadores", value: form.stats.length },
        ]}
        actions={
          <Link href={site.about} className={developerSecondaryButtonClassName}>
            <ArrowSquareOut size={16} weight="bold" />
            Abrir pagina publica
          </Link>
        }
      />

      {loading ? (
        <div className="mt-6">
          <DeveloperMessage tone="info">Carregando hero da pagina sobre...</DeveloperMessage>
        </div>
      ) : null}

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <DeveloperCard>
          <DeveloperSectionHeading
            eyebrow="Formulario principal"
            title="Editar hero da pagina sobre"
            description="Tag, titulo, subtitulo, imagem principal e os tres numeros em destaque."
          />

          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <DeveloperField label="Tag" required>
                <input
                  value={form.tag}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, tag: event.target.value }))
                  }
                  maxLength={60}
                  className={developerInputClassName}
                />
              </DeveloperField>
              <DeveloperField label="Imagem do hero" required>
                <input
                  value={form.image}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, image: event.target.value }))
                  }
                  className={developerInputClassName}
                />
              </DeveloperField>
            </div>

            <DeveloperField label="Titulo principal" required>
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                maxLength={140}
                className={developerInputClassName}
              />
            </DeveloperField>

            <DeveloperField label="Subtitulo" required>
              <textarea
                rows={4}
                value={form.subtitle}
                onChange={(event) =>
                  setForm((current) => ({ ...current, subtitle: event.target.value }))
                }
                maxLength={320}
                className={`${developerInputClassName} resize-none`}
              />
            </DeveloperField>

            <div className="rounded-[24px] border border-[var(--border)] bg-white/68 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                Numeros em destaque
              </p>

              <div className="mt-4 space-y-4">
                {form.stats.map((item, index) => (
                  <div key={index} className="grid gap-4 sm:grid-cols-2">
                    <DeveloperField label={`Numero ${index + 1}`} required>
                      <input
                        value={item.number}
                        onChange={(event) => setStat(index, "number", event.target.value)}
                        maxLength={20}
                        className={developerInputClassName}
                      />
                    </DeveloperField>
                    <DeveloperField label={`Descricao ${index + 1}`} required>
                      <input
                        value={item.description}
                        onChange={(event) =>
                          setStat(index, "description", event.target.value)
                        }
                        maxLength={80}
                        className={developerInputClassName}
                      />
                    </DeveloperField>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={handleSave} disabled={saving} className={developerPrimaryButtonClassName}>
                <CheckCircle size={18} weight="bold" />
                {saving ? "Salvando..." : "Salvar hero"}
              </button>
              <Link href={site.about} className={developerSecondaryButtonClassName}>
                <ArrowSquareOut size={16} weight="bold" />
                Ver pagina sobre
              </Link>
            </div>

            {status === "success" ? (
              <DeveloperMessage tone="success">
                {statusMessage}
              </DeveloperMessage>
            ) : null}

            {status === "error" || error ? (
              <DeveloperMessage tone="error">
                {status === "error" ? statusMessage : error}
              </DeveloperMessage>
            ) : null}
          </div>
        </DeveloperCard>

        <DeveloperCard>
          <DeveloperSectionHeading
            eyebrow="Preview textual"
            title="Resumo do que sera publicado"
            description="Conferencia rapida do conteudo que alimenta o topo da pagina sobre."
          />

          <div className="space-y-4">
            <div className="rounded-[24px] border border-[var(--border)] bg-white/72 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                Hero
              </p>
              <p className="mt-2 text-sm font-medium text-[var(--foreground)]">{form.tag}</p>
              <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">
                {form.title}
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--color-muted-raw)]">
                {form.subtitle}
              </p>
              <p className="mt-3 text-xs text-[var(--color-muted-raw)]">Imagem: {form.image}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {form.stats.map((item, index) => (
                <div
                  key={index}
                  className="rounded-[22px] border border-[var(--border)] bg-white/72 px-4 py-4"
                >
                  <p className="text-2xl font-bold tracking-[-0.05em] text-[var(--foreground)]">
                    {item.number}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-muted-raw)]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </DeveloperCard>
      </section>
    </DeveloperPage>
  );
}

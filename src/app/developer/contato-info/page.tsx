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
import { getContactSiteTexts, type ContactSiteTexts } from "@/lib/siteTexts";
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

type ContactFieldKey = keyof ContactSiteTexts;

const FIELD_SECTIONS: Array<{
  title: string;
  description: string;
  fields: Array<{
    key: ContactFieldKey;
    label: string;
    type?: "text" | "url" | "email";
    hint?: string;
    span?: "full";
  }>;
}> = [
  {
    title: "Hero da pagina",
    description: "Esses textos aparecem logo no topo do contato publico.",
    fields: [
      { key: "pageTitle", label: "Titulo da pagina" },
      {
        key: "pageSubtitle",
        label: "Subtitulo",
        span: "full",
        hint: "Use uma mensagem curta para orientar o visitante.",
      },
    ],
  },
  {
    title: "Canais oficiais",
    description: "Telefone, e-mail e WhatsApp que alimentam os cards principais.",
    fields: [
      { key: "phoneNumber", label: "Telefone principal" },
      { key: "phoneHours", label: "Horario de atendimento" },
      { key: "emailAddress", label: "E-mail comercial", type: "email" },
      { key: "emailResponse", label: "Prazo de retorno" },
      { key: "whatsappUrl", label: "Link do WhatsApp", type: "url" },
      { key: "whatsappLabel", label: "Rotulo do WhatsApp" },
    ],
  },
  {
    title: "Endereco e CTA",
    description: "Informacoes institucionais e botao final da pagina.",
    fields: [
      { key: "addressLine", label: "Endereco completo", span: "full" },
      { key: "addressZip", label: "CEP" },
      { key: "addressCountry", label: "Pais" },
      { key: "ctaLabel", label: "Texto do CTA" },
      { key: "ctaUrl", label: "Link do CTA", type: "url" },
    ],
  },
];

export default function ContatoInfoPage() {
  const { apiRequest } = useApiRequest();
  const [texts, setTexts] = useState<ContactSiteTexts>(getContactSiteTexts());
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"" | "success" | "error">("");
  const [statusMessage, setStatusMessage] = useState("");
  const { data, loading, error, refresh } = useAdminResource<ContactSiteTexts>({
    key: adminResourceKeys.contactInfo,
    fetcher: async (request) => {
      const response = await request<{ siteTexts?: Record<string, string> }>(
        api.admin.siteTexts
      );

      if (!response.success) {
        return {
          success: false,
          error: response.error ?? "Falha ao carregar os textos.",
        };
      }

      return {
        success: true,
        data: getContactSiteTexts(response.data?.siteTexts),
      };
    },
  });

  useEffect(() => {
    if (!data) return;
    setTexts(data);
  }, [data]);

  const filledFields = useMemo(
    () =>
      Object.values(texts).filter((value) => String(value).trim().length > 0).length,
    [texts]
  );

  async function handleSave() {
    setSaving(true);
    setStatus("");
    setStatusMessage("");

    const response = await apiRequest(api.admin.siteTexts, {
      method: "POST",
      body: JSON.stringify({
        contactPageTitle: texts.pageTitle,
        contactPageSubtitle: texts.pageSubtitle,
        contactPhoneNumber: texts.phoneNumber,
        contactPhoneHours: texts.phoneHours,
        contactEmailAddress: texts.emailAddress,
        contactEmailResponse: texts.emailResponse,
        contactWhatsappUrl: texts.whatsappUrl,
        contactWhatsappLabel: texts.whatsappLabel,
        contactAddressLine: texts.addressLine,
        contactAddressZip: texts.addressZip,
        contactAddressCountry: texts.addressCountry,
        contactCtaLabel: texts.ctaLabel,
        contactCtaUrl: texts.ctaUrl,
      }),
    });

    setSaving(false);

    if (!response.success) {
      setStatus("error");
      setStatusMessage(response.error ?? "Falha ao salvar os textos.");
      return;
    }

    invalidateAdminResource([adminResourceKeys.contactInfo, adminResourceKeys.dashboard]);
    setStatus("success");
    setStatusMessage("Dados de contato salvos com sucesso.");
    await refresh();
  }

  function setValue<K extends ContactFieldKey>(key: K, value: ContactSiteTexts[K]) {
    setTexts((current) => ({ ...current, [key]: value }));
  }

  return (
    <DeveloperPage>
      <DeveloperHero
        eyebrow="Conteudo - Contato"
        title="Textos e dados da pagina de contato."
        description="A configuracao foi trazida da versao estatica, agora ligada ao site atual e ao storage de site texts."
        stats={[
          { label: "Campos preenchidos", value: `${filledFields}/13` },
          { label: "Blocos afetados", value: 4 },
        ]}
        actions={
          <Link href={site.contact} className={developerSecondaryButtonClassName}>
            <ArrowSquareOut size={16} weight="bold" />
            Abrir pagina publica
          </Link>
        }
      />

      {loading ? (
        <div className="mt-6">
          <DeveloperMessage tone="info">Carregando configuracao de contato...</DeveloperMessage>
        </div>
      ) : null}

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <DeveloperCard>
          <DeveloperSectionHeading
            eyebrow="Formulario principal"
            title="Editar informacoes institucionais"
            description="As alteracoes abaixo alimentam a pagina /fale-conosco do projeto React atual."
          />

          <div className="space-y-8">
            {FIELD_SECTIONS.map((section) => (
              <div key={section.title}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                  {section.title}
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-muted-raw)]">
                  {section.description}
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {section.fields.map((field) => (
                    <DeveloperField
                      key={field.key}
                      label={field.label}
                      hint={field.hint}
                      className={field.span === "full" ? "sm:col-span-2" : undefined}
                    >
                      {field.key === "pageSubtitle" || field.key === "addressLine" ? (
                        <textarea
                          rows={field.key === "pageSubtitle" ? 3 : 2}
                          value={texts[field.key]}
                          onChange={(event) => setValue(field.key, event.target.value)}
                          className={`${developerInputClassName} resize-none`}
                        />
                      ) : (
                        <input
                          type={field.type ?? "text"}
                          value={texts[field.key]}
                          onChange={(event) => setValue(field.key, event.target.value)}
                          className={developerInputClassName}
                        />
                      )}
                    </DeveloperField>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={handleSave} disabled={saving} className={developerPrimaryButtonClassName}>
              <CheckCircle size={18} weight="bold" />
              {saving ? "Salvando..." : "Salvar alteracoes"}
            </button>
            <Link href={site.contact} className={developerSecondaryButtonClassName}>
              <ArrowSquareOut size={16} weight="bold" />
              Ver contato publicado
            </Link>
          </div>

          {status === "success" ? (
            <div className="mt-5">
              <DeveloperMessage tone="success">
                {statusMessage}
              </DeveloperMessage>
            </div>
          ) : null}

          {status === "error" || error ? (
            <div className="mt-5">
              <DeveloperMessage tone="error">
                {status === "error" ? statusMessage : error}
              </DeveloperMessage>
            </div>
          ) : null}
        </DeveloperCard>

        <DeveloperCard>
          <DeveloperSectionHeading
            eyebrow="Resumo rapido"
            title="Onde cada campo aparece"
            description="Guia curto para evitar edicoes no lugar errado."
          />

          <div className="space-y-4">
            {[
              {
                title: "Hero",
                description: `${texts.pageTitle} - ${texts.pageSubtitle}`,
              },
              {
                title: "Telefone",
                description: `${texts.phoneNumber} - ${texts.phoneHours}`,
              },
              {
                title: "E-mail",
                description: `${texts.emailAddress} - ${texts.emailResponse}`,
              },
              {
                title: "WhatsApp",
                description: `${texts.whatsappLabel} - ${texts.whatsappUrl}`,
              },
              {
                title: "Endereco",
                description: `${texts.addressLine} - ${texts.addressZip} - ${texts.addressCountry}`,
              },
              {
                title: "CTA final",
                description: `${texts.ctaLabel} - ${texts.ctaUrl}`,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[24px] border border-[var(--border)] bg-white/72 px-4 py-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                  {item.title}
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-muted-raw)]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </DeveloperCard>
      </section>
    </DeveloperPage>
  );
}

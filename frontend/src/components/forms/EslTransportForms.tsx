"use client";

import { useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import {
  CheckCircle,
  CaretDown,
  ClipboardText,
  Copy,
  Package,
  PaperPlaneTilt,
  SpinnerGap,
  Truck,
  WarningCircle,
} from "@phosphor-icons/react";
import { DeveloperTooltip } from "@/components/developer/ui";
import { useApiRequest } from "@/hooks/useApiRequest";
import { api, external, site } from "@/lib/routes";
import styles from "./EslTransportForms.module.css";

type RequestStatus = "idle" | "loading" | "success" | "error";
type QuoteKind = "fractional" | "closed";

interface QuoteValues {
  kind: QuoteKind;
  corporationUnitId: string;
  customerCnpj: string;
  senderCnpj: string;
  recipientCnpj: string;
  originPostalCode: string;
  originName: string;
  originStateCode: string;
  destinationPostalCode: string;
  destinationName: string;
  destinationStateCode: string;
  realWeight: string;
  cubicVolume: string;
  height: string;
  width: string;
  length: string;
  invoiceValue: string;
  invoiceVolumes: string;
  requesterName: string;
  requesterPhone: string;
  requesterEmail: string;
  productClassificationName: string;
  comments: string;
}

export interface QuoteBranch {
  id: string;
  city: string;
  stateCode: string;
  genericPostalCode: string;
  isDefault: boolean;
}

interface QuoteResponse {
  quote: {
    id: string;
    sequenceCode: string;
    referenceNumber: string;
    requestedAt: string;
    price: {
      stretches: Array<{ total: number }>;
      total: number | null;
    };
  };
}

interface WhatsappMessageResponse {
  whatsappMessage: string;
}

interface CollectionValues {
  corporationCnpj: string;
  customerCnpj: string;
  pickupLocationCnpj: string;
  payerCnpj: string;
  senderCnpj: string;
  recipientCnpj: string;
  serviceDate: string;
  serviceStartHour: string;
  serviceEndHour: string;
  invoiceKey: string;
  invoiceNumber: string;
  invoiceSeries: string;
  referenceNumber: string;
  comments: string;
}

interface ValidatedInvoice {
  id: string;
  key: string;
  number: string;
  series: string;
  issueDate: string;
  value: number;
  volume: number;
  weight: number;
  status: string;
}

interface InvoiceValidationResponse {
  invoice: ValidatedInvoice;
}

interface CollectionResponse {
  requiresWhatsApp: false;
  collection: {
    id: string;
    sequenceCode: string;
    status: string;
  };
}

interface CollectionWhatsappResponse {
  requiresWhatsApp: true;
  whatsappMessage: string;
}

const fieldClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-slate-400 shadow-[inset_0_1px_0_rgba(15,23,42,0.03)] outline-none transition-all duration-200 focus:border-[var(--primary)]/45 focus:ring-4 focus:ring-[var(--primary)]/12";

const sectionTitleClassName =
  "text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]";

const fieldHelp: Record<string, string> = {
  "Filial Rodogarcia": "Escolha a cidade da unidade Rodogarcia que atenderá esta operação. O CNPJ é enviado internamente.",
  "CNPJ do cliente e pagador": "Informe o CNPJ da empresa cliente, que também será usada como responsável pelo pagamento do frete.",
  "CNPJ do local de coleta": "Informe o CNPJ do endereço onde a mercadoria será coletada.",
  "CNPJ do remetente": "Informe o CNPJ de quem está enviando a mercadoria.",
  "CNPJ do destinatário": "Informe o CNPJ de quem receberá a mercadoria.",
  "CEP de origem": "Informe o CEP de onde a carga parte para preencher automaticamente cidade e UF.",
  "Cidade de origem": "Informe a cidade de onde a carga parte. Nas cidades configuradas, o CEP genérico é preenchido automaticamente.",
  "UF de origem": "Informe a sigla do estado de origem, com duas letras.",
  "CEP de destino": "Informe o CEP para onde a carga seguirá para preencher automaticamente cidade e UF.",
  "Cidade de destino": "Informe a cidade de destino. Nas cidades configuradas, o CEP genérico é preenchido automaticamente.",
  "UF de destino": "Informe a sigla do estado de destino, com duas letras.",
  "Peso real (kg)": "Informe o peso total real da mercadoria em quilogramas.",
  "Metro cúbico (m³)": "Informe o volume total ocupado pela carga em metros cúbicos.",
  "Altura (m)": "Informe a altura em metros. Junto com largura e comprimento, ela calcula o metro cúbico automaticamente.",
  "Largura (m)": "Informe a largura em metros. Este é um campo opcional de apoio ao cálculo do volume.",
  "Comprimento (m)": "Informe o comprimento em metros. Este é um campo opcional de apoio ao cálculo do volume.",
  "Valor da NF (R$)": "Informe o valor total da nota fiscal em reais.",
  Quantidade: "Informe a quantidade total de caixas, pallets ou demais volumes.",
  "Classificação do produto": "Descreva o produto ou a categoria da mercadoria, se disponível.",
  "Nome": "Informe o nome da pessoa responsável por esta solicitação.",
  "Telefone": "Informe um telefone com DDD para contato sobre a operação.",
  "E-mail": "Informe o e-mail que receberá as informações da solicitação.",
  "Observações": "Inclua detalhes úteis para a operação que não aparecem nos demais campos.",
  "Data": "Escolha a data desejada para a coleta.",
  "Horário inicial": "Informe a partir de que horário a coleta pode começar.",
  "Horário final": "Informe até que horário a coleta pode ser realizada.",
  "Referência interna": "Informe um código, pedido ou referência interna para facilitar a identificação.",
  "Chave da NF": "Informe a chave de acesso de 44 dígitos da nota fiscal, quando disponível.",
  "Número da NF": "Informe o número da nota fiscal que será validada.",
  "Série": "Informe a série da nota fiscal, se houver.",
};

const defaultQuoteValues: QuoteValues = {
  kind: "fractional",
  corporationUnitId: "",
  customerCnpj: "",
  senderCnpj: "",
  recipientCnpj: "",
  originPostalCode: "",
  originName: "",
  originStateCode: "",
  destinationPostalCode: "",
  destinationName: "",
  destinationStateCode: "",
  realWeight: "",
  cubicVolume: "",
  height: "",
  width: "",
  length: "",
  invoiceValue: "",
  invoiceVolumes: "",
  requesterName: "",
  requesterPhone: "",
  requesterEmail: "",
  productClassificationName: "",
  comments: "",
};

const defaultCollectionValues: CollectionValues = {
  corporationCnpj: "",
  customerCnpj: "",
  pickupLocationCnpj: "",
  payerCnpj: "",
  senderCnpj: "",
  recipientCnpj: "",
  serviceDate: "",
  serviceStartHour: "",
  serviceEndHour: "",
  invoiceKey: "",
  invoiceNumber: "",
  invoiceSeries: "",
  referenceNumber: "",
  comments: "",
};

function dispatchFormTracking(form: "quote" | "collection", status: "success" | "fail", reason = "") {
  window.dispatchEvent(
    new CustomEvent(status === "success" ? "rg:form-success" : "rg:form-fail", {
      detail: { form, reason },
    })
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatMetric(value: number, unit: string) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value) + unit;
}

function isWhatsappUrl(url: string) {
  return /^https:\/\/(?:wa\.me|api\.whatsapp\.com)\//i.test(url);
}

function whatsappUrl(baseUrl: string, message: string) {
  if (!isWhatsappUrl(baseUrl)) return null;
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}text=${encodeURIComponent(message)}`;
}

async function copyMessage(message: string) {
  if (!navigator.clipboard?.writeText) return false;
  await navigator.clipboard.writeText(message);
  return true;
}

function Field({
  label,
  required = false,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const help = fieldHelp[label] ?? `Informe ${label.toLocaleLowerCase("pt-BR")} para seguir com a solicitação.`;
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[var(--foreground)]">
        {label}
        {required ? <span className="text-[var(--primary)]"> *</span> : null}
        <DeveloperTooltip content={help} compact />
      </span>
      {children}
    </label>
  );
}

function Fieldset({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={`grid gap-5 rounded-[28px] border border-slate-200/85 bg-slate-50/82 p-5 shadow-[0_14px_32px_rgba(15,23,42,0.045)] sm:p-6 ${className}`}>
      <legend className="sr-only">{title}</legend>
      <div>
        <p className={sectionTitleClassName}>{title}</p>
        {description ? <p className="mt-1 text-sm leading-6 text-[var(--color-muted-raw)]">{description}</p> : null}
      </div>
      {children}
    </fieldset>
  );
}

function Alert({ kind, children }: { kind: "error" | "info"; children: ReactNode }) {
  const className =
    kind === "error"
      ? "border-red-500/16 bg-red-500/8 text-red-700"
      : "border-sky-500/16 bg-sky-500/8 text-sky-900";
  return (
    <div className={`flex gap-3 rounded-2xl border px-4 py-3 text-sm leading-6 ${className}`} role={kind === "error" ? "alert" : "status"}>
      <WarningCircle size={19} weight="fill" className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

function MessageActions({
  message,
  fallbackLabel,
  channelUrl,
}: {
  message: string;
  fallbackLabel: string;
  channelUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const url = whatsappUrl(channelUrl, message);

  async function handleCopy() {
    try {
      const didCopy = await copyMessage(message);
      setCopied(didCopy);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-6">
      <textarea value={message} readOnly rows={7} aria-label="Mensagem preparada para atendimento" className="w-full resize-none rounded-2xl border border-[var(--border)] bg-white/78 p-4 text-left text-xs leading-5 text-[var(--foreground)] outline-none" />
      <div className="mt-3 flex flex-col justify-center gap-3 sm:flex-row">
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            Abrir WhatsApp
          </a>
        ) : (
          <a
            href={site.contact}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[var(--primary)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-strong)]"
          >
            {fallbackLabel}
          </a>
        )}
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--color-surface-2)]"
        >
          <Copy size={17} weight="bold" />
          {copied ? "Mensagem copiada" : "Copiar mensagem"}
        </button>
      </div>
    </div>
  );
}

function SubmitButton({
  loading,
  children,
  className = "",
}: {
  loading: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={`inline-flex min-h-14 min-w-[13rem] items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_20px_44px_rgba(5,150,105,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {loading ? <SpinnerGap size={18} className="animate-spin" weight="bold" /> : <PaperPlaneTilt size={18} weight="bold" />}
      {children}
    </button>
  );
}

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function volumeFromDimensions(height: string, width: string, length: string) {
  const dimensions = [height, width, length].map((value) => Number(value.replace(",", ".")));
  return dimensions.every((value) => Number.isFinite(value) && value > 0)
    ? dimensions.reduce((total, value) => total * value, 1)
    : null;
}

export function EslQuoteForm({ quoteBranches }: { quoteBranches: QuoteBranch[] }) {
  const { apiRequest } = useApiRequest();
  const [values, setValues] = useState<QuoteValues>(defaultQuoteValues);
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [error, setError] = useState("");
  const [quote, setQuote] = useState<QuoteResponse["quote"] | null>(null);
  const [closedMessage, setClosedMessage] = useState("");
  const postalLookupTimer = useRef<number | null>(null);

  const kindLabel = values.kind === "fractional" ? "carga fracionada" : "carga fechada";

  function update<K extends keyof QuoteValues>(key: K, value: QuoteValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function updateDimensions(key: "height" | "width" | "length", value: string) {
    setValues((current) => {
      const next = { ...current, [key]: value };
      const calculated = volumeFromDimensions(next.height, next.width, next.length);
      return calculated === null ? next : { ...next, cubicVolume: String(Number(calculated.toFixed(4))) };
    });
  }

  async function fillCityFromPostalCode(kind: "origin" | "destination", rawPostalCode: string) {
    const postalCode = digits(rawPostalCode);
    if (postalCode.length !== 8) return;
    try {
      const response = await fetch(api.public.postalCode(postalCode));
      if (!response.ok) return;
      const data: unknown = await response.json();
      if (!data || typeof data !== "object") return;
      const address = data as { city?: unknown; stateCode?: unknown };
      const city = typeof address.city === "string" ? address.city : "";
      const stateCode = typeof address.stateCode === "string" ? address.stateCode : "";
      if (city && stateCode) {
        setValues((current) =>
          digits(current[`${kind}PostalCode`]) === postalCode
            ? { ...current, [`${kind}Name`]: city, [`${kind}StateCode`]: stateCode }
            : current
        );
      }
    } catch {
      // O visitante ainda pode preencher cidade e UF manualmente se a consulta estiver indisponível.
    }
  }

  function schedulePostalLookup(kind: "origin" | "destination", postalCode: string) {
    if (postalLookupTimer.current !== null) window.clearTimeout(postalLookupTimer.current);
    if (digits(postalCode).length !== 8) return;
    postalLookupTimer.current = window.setTimeout(() => {
      void fillCityFromPostalCode(kind, postalCode);
      postalLookupTimer.current = null;
    }, 350);
  }

  function fillPostalCodeFromCity(kind: "origin" | "destination") {
    const city = values[`${kind}Name`].trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const stateCode = values[`${kind}StateCode`].trim().toUpperCase();
    const branch = quoteBranches.find((item) =>
      item.city.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === city &&
      (!stateCode || item.stateCode === stateCode) && /^\d{8}$/.test(item.genericPostalCode)
    );
    if (branch) {
      setValues((current) => ({ ...current, [`${kind}PostalCode`]: branch.genericPostalCode, [`${kind}StateCode`]: branch.stateCode }));
    }
  }

  function input<K extends keyof QuoteValues>(key: K) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      update(key, event.target.value as QuoteValues[K]);
    };
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError("");
    setQuote(null);
    setClosedMessage("");

    const payload = {
      corporationUnitId: values.corporationUnitId,
      customerCnpj: values.customerCnpj,
      senderCnpj: values.senderCnpj,
      recipientCnpj: values.recipientCnpj,
      origin: {
        postalCode: values.originPostalCode,
        name: values.originName,
        stateCode: values.originStateCode,
      },
      destination: {
        postalCode: values.destinationPostalCode,
        name: values.destinationName,
        stateCode: values.destinationStateCode,
      },
      realWeight: values.realWeight,
      cubicVolume: values.cubicVolume,
      invoiceValue: values.invoiceValue,
      invoiceVolumes: values.invoiceVolumes,
      requesterName: values.requesterName,
      requesterPhone: values.requesterPhone,
      requesterEmail: values.requesterEmail,
      productClassificationName: values.productClassificationName,
      comments: values.comments,
    };

    if (values.kind === "fractional") {
      const result = await apiRequest<QuoteResponse>(api.eslTransport.quoteFractional, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!result.success || !result.data) {
        const reason = result.error ?? "Não foi possível calcular a cotação.";
        setError(reason);
        setStatus("error");
        dispatchFormTracking("quote", "fail", reason);
        return;
      }
      setQuote(result.data.quote);
      setStatus("success");
      dispatchFormTracking("quote", "success");
      return;
    }

    const result = await apiRequest<WhatsappMessageResponse>(api.eslTransport.quoteClosedWhatsapp, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!result.success || !result.data) {
      const reason = result.error ?? "Não foi possível preparar o atendimento.";
      setError(reason);
      setStatus("error");
      dispatchFormTracking("quote", "fail", reason);
      return;
    }
    setClosedMessage(result.data.whatsappMessage);
    setStatus("success");
    dispatchFormTracking("quote", "success");
  }

  if (status === "success" && quote) {
    return (
      <div className="rounded-[32px] border border-emerald-500/18 bg-[linear-gradient(180deg,rgba(236,253,245,0.94)_0%,rgba(255,255,255,0.96)_100%)] p-6 text-center shadow-[0_24px_56px_rgba(15,23,42,0.08)] sm:p-8" role="status">
        <CheckCircle size={38} weight="fill" className="mx-auto text-emerald-600" />
        <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">Cotação criada.</h3>
        <p className="mt-3 text-sm leading-7 text-[var(--color-muted-raw)]">Referência {quote.sequenceCode || quote.referenceNumber || "registrada"}.</p>
        <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-emerald-500/14 bg-white/86 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Valor da cotação</p>
          <p className="mt-1 text-3xl font-bold tracking-[-0.05em] text-[var(--foreground)]">
            {quote.price.total === null ? "Em análise" : formatCurrency(quote.price.total)}
          </p>
        </div>
        <button type="button" onClick={() => { setValues(defaultQuoteValues); setStatus("idle"); }} className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--color-surface-2)]">
          Fazer outra cotação
        </button>
      </div>
    );
  }

  if (status === "success" && closedMessage) {
    return (
      <div className="rounded-[32px] border border-emerald-500/18 bg-[linear-gradient(180deg,rgba(236,253,245,0.94)_0%,rgba(255,255,255,0.96)_100%)] p-6 text-center shadow-[0_24px_56px_rgba(15,23,42,0.08)] sm:p-8" role="status">
        <CheckCircle size={38} weight="fill" className="mx-auto text-emerald-600" />
        <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">Dados prontos para o atendimento.</h3>
        <p className="mt-3 text-sm leading-7 text-[var(--color-muted-raw)]">A carga fechada seguirá pelo time comercial. Envie a mensagem abaixo para continuar.</p>
        <MessageActions message={closedMessage} fallbackLabel="Abrir atendimento" channelUrl={external.whatsappQuoteFull} />
        <button type="button" onClick={() => setStatus("idle")} className="mt-4 text-sm font-semibold text-[var(--primary)] hover:underline">Editar dados</button>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="grid gap-5 lg:grid-cols-12 lg:items-start" noValidate>
      <div className="flex flex-col gap-5 rounded-[28px] border border-blue-200/80 bg-[linear-gradient(135deg,rgba(239,246,255,0.98)_0%,rgba(219,234,254,0.82)_100%)] p-5 shadow-[0_18px_42px_rgba(30,64,175,0.08)] sm:p-6 lg:col-span-12 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className={sectionTitleClassName}>Dados da operação</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">Preencha para calcular sua cotação.</h2>
        </div>
        <span className="w-fit rounded-full border border-[var(--border)] bg-white/74 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-raw)]">Retorno pelo ESL</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:col-span-12" role="radiogroup" aria-label="Tipo de carga">
        {(["fractional", "closed"] as const).map((kind) => {
          const selected = values.kind === kind;
          const Icon = kind === "fractional" ? Package : Truck;
          return (
            <button key={kind} type="button" onClick={() => update("kind", kind)} aria-pressed={selected} className={`relative rounded-2xl border p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 ${styles.quoteKindCard} ${selected ? styles.quoteKindCardSelected : "border-[var(--border)] bg-white/72 hover:bg-white"}`}>
              <span className="flex items-start gap-3">
                <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${selected ? "bg-[linear-gradient(135deg,#2563eb_0%,#059669_100%)] text-white shadow-[0_8px_18px_rgba(37,99,235,0.24)]" : "bg-slate-100 text-slate-600"}`}><Icon size={21} weight="duotone" /></span>
                <span>
                  <span className="block text-sm font-semibold text-[var(--foreground)]">{kind === "fractional" ? "Carga fracionada" : "Carga fechada"}</span>
                  <span className="mt-1 block text-xs leading-5 text-[var(--color-muted-raw)]">{kind === "fractional" ? "Para volumes que seguem junto de outras cargas; o valor é calculado nesta página." : "Para um veículo dedicado à sua operação; os dados seguem para atendimento comercial."}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <Fieldset title="Empresas envolvidas" description="Selecione a filial e informe o CNPJ do cliente responsável pela operação." className="lg:col-span-12">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Filial Rodogarcia" required><div className="relative"><select value={values.corporationUnitId} onChange={input("corporationUnitId")} className={`${fieldClassName} appearance-none pr-10`}><option value="">Selecione a cidade</option>{quoteBranches.map((branch) => <option key={branch.id} value={branch.id}>{branch.city}/{branch.stateCode}</option>)}</select><CaretDown aria-hidden size={17} weight="bold" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" /></div></Field>
          <Field label="CNPJ do cliente e pagador" required><input value={values.customerCnpj} onChange={input("customerCnpj")} inputMode="numeric" autoComplete="off" placeholder="00.000.000/0000-00" className={fieldClassName} /></Field>
          <Field label="CNPJ do remetente"><input value={values.senderCnpj} onChange={input("senderCnpj")} inputMode="numeric" autoComplete="off" placeholder="00.000.000/0000-00" className={fieldClassName} /></Field>
          <Field label="CNPJ do destinatário"><input value={values.recipientCnpj} onChange={input("recipientCnpj")} inputMode="numeric" autoComplete="off" placeholder="00.000.000/0000-00" className={fieldClassName} /></Field>
        </div>
      </Fieldset>

      <Fieldset title="Origem e destino" className="lg:col-span-12">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="CEP de origem" required><input value={values.originPostalCode} onChange={(event) => { update("originPostalCode", event.target.value); schedulePostalLookup("origin", event.target.value); }} onBlur={(event) => void fillCityFromPostalCode("origin", event.currentTarget.value)} inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" className={fieldClassName} /></Field>
          <Field label="Cidade de origem" required><input value={values.originName} onChange={input("originName")} onBlur={() => fillPostalCodeFromCity("origin")} list="quote-cities" autoComplete="address-level2" placeholder="Ex.: Osasco" className={fieldClassName} /></Field>
          <Field label="UF de origem" required><input value={values.originStateCode} onChange={input("originStateCode")} maxLength={2} autoComplete="address-level1" placeholder="SP" className={fieldClassName} /></Field>
          <Field label="CEP de destino" required><input value={values.destinationPostalCode} onChange={(event) => { update("destinationPostalCode", event.target.value); schedulePostalLookup("destination", event.target.value); }} onBlur={(event) => void fillCityFromPostalCode("destination", event.currentTarget.value)} inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" className={fieldClassName} /></Field>
          <Field label="Cidade de destino" required><input value={values.destinationName} onChange={input("destinationName")} onBlur={() => fillPostalCodeFromCity("destination")} list="quote-cities" autoComplete="address-level2" placeholder="Ex.: Agudos" className={fieldClassName} /></Field>
          <Field label="UF de destino" required><input value={values.destinationStateCode} onChange={input("destinationStateCode")} maxLength={2} autoComplete="address-level1" placeholder="SP" className={fieldClassName} /></Field>
        </div>
        <datalist id="quote-cities">{quoteBranches.map((branch) => <option key={branch.id} value={branch.city}>{branch.city}/{branch.stateCode}</option>)}</datalist>
      </Fieldset>

      <Fieldset title="Dados da carga" className="lg:col-span-7 lg:self-stretch">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))] [&>label]:min-w-0 [&>label>span]:whitespace-nowrap">
          <Field label="Peso real (kg)" required><input value={values.realWeight} onChange={input("realWeight")} type="number" min="0" step="0.01" inputMode="decimal" placeholder="25000" className={fieldClassName} /></Field>
          <Field label="Metro cúbico (m³)" required><input value={values.cubicVolume} onChange={input("cubicVolume")} type="number" min="0" step="0.01" inputMode="decimal" placeholder="25" className={fieldClassName} /></Field>
          <Field label="Altura (m)"><input value={values.height} onChange={(event) => updateDimensions("height", event.target.value)} type="number" min="0" step="0.01" inputMode="decimal" placeholder="1,2" className={fieldClassName} /></Field>
          <Field label="Largura (m)"><input value={values.width} onChange={(event) => updateDimensions("width", event.target.value)} type="number" min="0" step="0.01" inputMode="decimal" placeholder="0,8" className={fieldClassName} /></Field>
          <Field label="Comprimento (m)"><input value={values.length} onChange={(event) => updateDimensions("length", event.target.value)} type="number" min="0" step="0.01" inputMode="decimal" placeholder="2,5" className={fieldClassName} /></Field>
          <Field label="Valor da NF (R$)" required><input value={values.invoiceValue} onChange={input("invoiceValue")} type="number" min="0" step="0.01" inputMode="decimal" placeholder="250000" className={fieldClassName} /></Field>
          <Field label="Quantidade" required className="lg:col-span-2"><input value={values.invoiceVolumes} onChange={input("invoiceVolumes")} type="number" min="1" step="1" inputMode="numeric" placeholder="150" className={fieldClassName} /></Field>
          <div className="sm:col-span-2 lg:col-span-4"><Field label="Classificação do produto"><input value={values.productClassificationName} onChange={input("productClassificationName")} placeholder="Ex.: Produtos químicos" className={fieldClassName} /></Field></div>
        </div>
      </Fieldset>

      <Fieldset title="Solicitante" className="lg:col-span-5 lg:self-stretch">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome" required><input value={values.requesterName} onChange={input("requesterName")} autoComplete="name" placeholder="Seu nome" className={fieldClassName} /></Field>
          <Field label="Telefone" required><input value={values.requesterPhone} onChange={input("requesterPhone")} type="tel" autoComplete="tel" placeholder="(00) 00000-0000" className={fieldClassName} /></Field>
          <Field label="E-mail" required><input value={values.requesterEmail} onChange={input("requesterEmail")} type="email" autoComplete="email" placeholder="seu@email.com" className={fieldClassName} /></Field>
          <Field label="Observações"><input value={values.comments} onChange={input("comments")} placeholder="Informações adicionais (opcional)" className={fieldClassName} /></Field>
        </div>
        <div className="flex justify-start border-t border-slate-300/80 pt-5 sm:justify-end">
          <SubmitButton loading={status === "loading"}>{status === "loading" ? "Enviando..." : values.kind === "fractional" ? "Calcular cotação" : `Preparar ${kindLabel}`}</SubmitButton>
        </div>
      </Fieldset>

      {status === "error" ? <div className="lg:col-span-12"><Alert kind="error">{error}</Alert></div> : null}
    </form>
  );
}

export function EslCollectionForm() {
  const { apiRequest } = useApiRequest();
  const [values, setValues] = useState<CollectionValues>(defaultCollectionValues);
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [validationStatus, setValidationStatus] = useState<RequestStatus>("idle");
  const [error, setError] = useState("");
  const [invoice, setInvoice] = useState<ValidatedInvoice | null>(null);
  const [collection, setCollection] = useState<CollectionResponse["collection"] | null>(null);
  const [whatsappMessage, setWhatsappMessage] = useState("");

  const validationFingerprint = useMemo(
    () => [values.corporationCnpj, values.customerCnpj, values.pickupLocationCnpj, values.payerCnpj, values.senderCnpj, values.recipientCnpj, values.invoiceKey, values.invoiceNumber, values.invoiceSeries].join("|"),
    [values.corporationCnpj, values.customerCnpj, values.invoiceKey, values.invoiceNumber, values.invoiceSeries, values.payerCnpj, values.pickupLocationCnpj, values.recipientCnpj, values.senderCnpj]
  );
  const [validatedFingerprint, setValidatedFingerprint] = useState("");
  const isInvoiceCurrent = Boolean(invoice && validationFingerprint === validatedFingerprint);

  function update<K extends keyof CollectionValues>(key: K, value: CollectionValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    if (["corporationCnpj", "customerCnpj", "pickupLocationCnpj", "payerCnpj", "senderCnpj", "recipientCnpj", "invoiceKey", "invoiceNumber", "invoiceSeries"].includes(key)) {
      setInvoice(null);
      setValidatedFingerprint("");
    }
  }

  function input<K extends keyof CollectionValues>(key: K) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      update(key, event.target.value as CollectionValues[K]);
    };
  }

  async function validateInvoice() {
    setValidationStatus("loading");
    setError("");
    setInvoice(null);
    const result = await apiRequest<InvoiceValidationResponse>(api.eslTransport.collectionInvoiceValidation, {
      method: "POST",
      body: JSON.stringify({
        invoiceKey: values.invoiceKey,
        invoiceNumber: values.invoiceNumber,
        invoiceSeries: values.invoiceSeries,
        senderCnpj: values.senderCnpj,
        recipientCnpj: values.recipientCnpj,
      }),
    });
    if (!result.success || !result.data) {
      const reason = result.error ?? "Não foi possível validar a nota fiscal.";
      setError(reason);
      setValidationStatus("error");
      return;
    }
    setInvoice(result.data.invoice);
    setValidatedFingerprint(validationFingerprint);
    setValidationStatus("success");
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!invoice || !isInvoiceCurrent) {
      setError("Valide a nota fiscal antes de solicitar a coleta.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setError("");
    setCollection(null);
    setWhatsappMessage("");

    const result = await apiRequest<CollectionResponse | CollectionWhatsappResponse>(api.eslTransport.collections, {
      method: "POST",
      body: JSON.stringify({
        corporationCnpj: values.corporationCnpj,
        customerCnpj: values.customerCnpj,
        pickupLocationCnpj: values.pickupLocationCnpj,
        payerCnpj: values.payerCnpj,
        senderCnpj: values.senderCnpj,
        recipientCnpj: values.recipientCnpj,
        serviceDate: values.serviceDate,
        serviceStartHour: values.serviceStartHour,
        serviceEndHour: values.serviceEndHour,
        invoiceId: invoice.id,
        invoice: {
          invoiceKey: values.invoiceKey,
          invoiceNumber: values.invoiceNumber,
          invoiceSeries: values.invoiceSeries,
          senderCnpj: values.senderCnpj,
          recipientCnpj: values.recipientCnpj,
        },
        referenceNumber: values.referenceNumber,
        comments: values.comments,
      }),
    });
    if (!result.success || !result.data) {
      const reason = result.error ?? "Não foi possível agendar a coleta.";
      setError(reason);
      setStatus("error");
      dispatchFormTracking("collection", "fail", reason);
      return;
    }
    if (result.data.requiresWhatsApp) {
      setWhatsappMessage(result.data.whatsappMessage);
    } else {
      setCollection(result.data.collection);
    }
    setStatus("success");
    dispatchFormTracking("collection", "success");
  }

  if (status === "success" && collection) {
    return (
      <div className="rounded-[32px] border border-emerald-500/18 bg-[linear-gradient(180deg,rgba(236,253,245,0.94)_0%,rgba(255,255,255,0.96)_100%)] p-6 text-center shadow-[0_24px_56px_rgba(15,23,42,0.08)] sm:p-8" role="status">
        <CheckCircle size={38} weight="fill" className="mx-auto text-emerald-600" />
        <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">Coleta registrada.</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--color-muted-raw)]">Número da coleta</p>
        <p className="mt-1 text-3xl font-bold tracking-[-0.05em] text-[var(--foreground)]">{collection.sequenceCode || collection.id}</p>
        <button type="button" onClick={() => { setValues(defaultCollectionValues); setInvoice(null); setValidatedFingerprint(""); setStatus("idle"); }} className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--color-surface-2)]">Solicitar outra coleta</button>
      </div>
    );
  }

  if (status === "success" && whatsappMessage) {
    return (
      <div className="rounded-[32px] border border-amber-500/20 bg-[linear-gradient(180deg,rgba(255,251,235,0.94)_0%,rgba(255,255,255,0.96)_100%)] p-6 text-center shadow-[0_24px_56px_rgba(15,23,42,0.08)] sm:p-8" role="status">
        <WarningCircle size={38} weight="fill" className="mx-auto text-amber-600" />
        <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">Precisamos concluir com o atendimento.</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--color-muted-raw)]">O CNPJ do cliente não foi reconhecido para registrar a coleta automaticamente.</p>
        <MessageActions message={whatsappMessage} fallbackLabel="Abrir atendimento" channelUrl={external.whatsappCommercial} />
        <button type="button" onClick={() => setStatus("idle")} className="mt-4 text-sm font-semibold text-[var(--primary)] hover:underline">Editar dados</button>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="grid gap-5 lg:grid-cols-12 lg:items-start" noValidate>
      <div className="flex flex-col gap-2 rounded-[28px] border border-blue-200/80 bg-[linear-gradient(135deg,rgba(239,246,255,0.98)_0%,rgba(219,234,254,0.82)_100%)] p-5 shadow-[0_18px_42px_rgba(30,64,175,0.08)] sm:flex-row sm:items-end sm:justify-between sm:p-6 lg:col-span-12">
        <div>
          <p className={sectionTitleClassName}>Agendamento de coleta</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">Registre a coleta com os dados da NF.</h2>
        </div>
        <span className="w-fit rounded-full border border-[var(--border)] bg-white/74 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-raw)]">Validação obrigatória</span>
      </div>

      <Fieldset title="Cadastros da operação" description="O cliente precisa estar cadastrado no ESL para que a coleta seja criada automaticamente." className="lg:col-span-12">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Field label="CNPJ da filial" required><input value={values.corporationCnpj} onChange={input("corporationCnpj")} inputMode="numeric" autoComplete="off" placeholder="00.000.000/0000-00" className={fieldClassName} /></Field>
          <Field label="CNPJ do cliente" required><input value={values.customerCnpj} onChange={input("customerCnpj")} inputMode="numeric" autoComplete="off" placeholder="00.000.000/0000-00" className={fieldClassName} /></Field>
          <Field label="CNPJ do local de coleta" required><input value={values.pickupLocationCnpj} onChange={input("pickupLocationCnpj")} inputMode="numeric" autoComplete="off" placeholder="00.000.000/0000-00" className={fieldClassName} /></Field>
          <Field label="CNPJ do pagador" required><input value={values.payerCnpj} onChange={input("payerCnpj")} inputMode="numeric" autoComplete="off" placeholder="00.000.000/0000-00" className={fieldClassName} /></Field>
          <Field label="CNPJ do remetente" required><input value={values.senderCnpj} onChange={input("senderCnpj")} inputMode="numeric" autoComplete="off" placeholder="00.000.000/0000-00" className={fieldClassName} /></Field>
          <Field label="CNPJ do destinatário" required><input value={values.recipientCnpj} onChange={input("recipientCnpj")} inputMode="numeric" autoComplete="off" placeholder="00.000.000/0000-00" className={fieldClassName} /></Field>
        </div>
      </Fieldset>

      <Fieldset title="Programação da coleta" className="lg:col-span-5 lg:self-stretch">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Data" required><input value={values.serviceDate} onChange={input("serviceDate")} type="date" className={fieldClassName} /></Field>
          <Field label="Horário inicial" required><input value={values.serviceStartHour} onChange={input("serviceStartHour")} type="time" className={fieldClassName} /></Field>
          <Field label="Horário final" required><input value={values.serviceEndHour} onChange={input("serviceEndHour")} type="time" className={fieldClassName} /></Field>
        </div>
        <div className="border-t border-slate-300/80 pt-5">
          <p className={sectionTitleClassName}>Referência e observações</p>
          <div className="mt-4 grid gap-4">
            <Field label="Referência interna"><input value={values.referenceNumber} onChange={input("referenceNumber")} placeholder="Opcional" className={fieldClassName} /></Field>
            <Field label="Observações"><input value={values.comments} onChange={input("comments")} placeholder="Opcional" className={fieldClassName} /></Field>
          </div>
        </div>
      </Fieldset>

      <Fieldset title="Nota fiscal" description="Valide a NF para confirmar seus valores, volumes e peso antes de agendar." className="lg:col-span-7 lg:self-stretch">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Chave da NF"><input value={values.invoiceKey} onChange={input("invoiceKey")} inputMode="numeric" autoComplete="off" placeholder="44 dígitos" className={fieldClassName} /></Field>
          <Field label="Número da NF"><input value={values.invoiceNumber} onChange={input("invoiceNumber")} autoComplete="off" placeholder="Ex.: 12345" className={fieldClassName} /></Field>
          <Field label="Série"><input value={values.invoiceSeries} onChange={input("invoiceSeries")} autoComplete="off" placeholder="Ex.: 1" className={fieldClassName} /></Field>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={() => void validateInvoice()} disabled={validationStatus === "loading"} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(29,78,216,0.2)] transition-colors hover:bg-[var(--color-primary-strong)] disabled:cursor-not-allowed disabled:opacity-60">
            {validationStatus === "loading" ? <SpinnerGap size={17} className="animate-spin" weight="bold" /> : <ClipboardText size={17} weight="bold" />}
            {validationStatus === "loading" ? "Validando..." : "Validar NF"}
          </button>
          {isInvoiceCurrent ? <span className="text-sm font-semibold text-emerald-700">NF validada</span> : <span className="text-xs text-[var(--color-muted-raw)]">Informe a chave ou o número da NF.</span>}
        </div>
        {isInvoiceCurrent && invoice ? (
          <div className="grid gap-3 rounded-2xl border border-emerald-500/14 bg-emerald-500/6 p-4 text-sm sm:grid-cols-3">
            <div><p className="text-xs text-emerald-800">Valor da NF</p><strong>{formatCurrency(invoice.value)}</strong></div>
            <div><p className="text-xs text-emerald-800">Volumes</p><strong>{formatMetric(invoice.volume, "")}</strong></div>
            <div><p className="text-xs text-emerald-800">Peso</p><strong>{formatMetric(invoice.weight, " kg")}</strong></div>
          </div>
        ) : null}
        <div className="grid gap-4 border-t border-slate-300/80 pt-5">
          {status === "error" || validationStatus === "error" ? <Alert kind="error">{error}</Alert> : null}
          <div className={`flex flex-col gap-3 sm:flex-row sm:items-center ${isInvoiceCurrent ? "sm:justify-end" : "sm:justify-between"}`}>
            {!isInvoiceCurrent ? <div className="sm:flex-1"><Alert kind="info">O agendamento será liberado depois que a nota fiscal for validada.</Alert></div> : null}
            <SubmitButton loading={status === "loading"} className="shrink-0">{status === "loading" ? "Solicitando..." : "Solicitar coleta"}</SubmitButton>
          </div>
        </div>
      </Fieldset>
    </form>
  );
}

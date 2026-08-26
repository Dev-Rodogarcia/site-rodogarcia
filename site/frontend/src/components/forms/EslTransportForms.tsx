"use client";

import { useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import {
  CheckCircle,
  ClipboardText,
  Copy,
  Package,
  PaperPlaneTilt,
  SpinnerGap,
  Truck,
  WarningCircle,
} from "@phosphor-icons/react";
import { HelpTooltip } from "@/components/ui/HelpTooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApiRequest } from "@/hooks/useApiRequest";
import { api, external, site } from "@/lib/routes";
import type { QuoteUnservedOriginContent } from "@/types/content";
import styles from "./EslTransportForms.module.css";

type RequestStatus = "idle" | "loading" | "success" | "error";
type QuoteKind = "fractional" | "closed";

interface QuoteValues {
  kind: QuoteKind;
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
  customerCnpj: string;
  pickupLocationCnpj: string;
  senderCnpj: string;
  recipientCnpj: string;
  originName: string;
  originStateCode: string;
  deliveryPostalCode: string;
  deliveryStreet: string;
  deliveryNumber: string;
  deliveryComplement: string;
  deliveryNeighborhood: string;
  deliveryCity: string;
  deliveryStateCode: string;
  serviceDate: string;
  serviceStartHour: string;
  serviceEndHour: string;
  invoiceKey: string;
  invoiceNumber: string;
  invoiceSeries: string;
  referenceNumber: string;
  comments: string;
}

interface InvoiceValidationResponse {
  validated: true;
  validationToken: string;
}

interface CompanyAddressResponse {
  cnpj: string;
  postalCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  stateCode: string;
}

interface CollectionResponse {
  requiresWhatsApp: false;
  collection: {
    id: string;
    sequenceCode: string;
    status: string;
    /** Capability efêmera em memória; nunca é exibida nem enviada em URL. */
    maintenanceToken: string;
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
  "CNPJ do cliente e pagador": "Informe os 14 números do CNPJ da empresa cliente, que também será usada como responsável pelo pagamento do frete. A pontuação é aplicada automaticamente.",
  "CNPJ do local de coleta": "Informe os 14 números do CNPJ do endereço onde a mercadoria será coletada. Este campo é obrigatório e a pontuação é aplicada automaticamente.",
  "CNPJ do remetente": "Informe os 14 números do CNPJ de quem está enviando a mercadoria, se disponível. A pontuação é aplicada automaticamente.",
  "CNPJ do destinatário": "Informe os 14 números do CNPJ de quem receberá a mercadoria, se disponível. A pontuação é aplicada automaticamente.",
  "CEP de entrega": "Informe os 8 números do CEP do endereço de entrega. O hífen é aplicado automaticamente e cidade e UF serão preenchidas quando a consulta estiver disponível.",
  Logradouro: "Informe a rua, avenida ou estrada do endereço de entrega.",
  Número: "Informe o número do endereço de entrega.",
  Complemento: "Informe bloco, sala, galpão, referência ou outro complemento, se necessário.",
  Bairro: "Informe o bairro do endereço de entrega, se disponível.",
  "Cidade de entrega": "Informe a cidade do endereço de entrega.",
  "UF de entrega": "Informe a sigla do estado do endereço de entrega, com duas letras.",
  "CEP de origem": "Informe os 8 números do CEP de onde a carga parte. O hífen é aplicado automaticamente para preencher cidade e UF.",
  "Cidade de origem": "Informe a cidade de onde a carga parte. O sistema consulta a região atendida para definir a filial responsável internamente.",
  "UF de origem": "Informe a sigla do estado de origem, com duas letras.",
  "CEP de destino": "Informe os 8 números do CEP para onde a carga seguirá. O hífen é aplicado automaticamente para preencher cidade e UF.",
  "Cidade de destino": "Informe a cidade para onde a carga seguirá.",
  "UF de destino": "Informe a sigla do estado de destino, com duas letras.",
  "Peso real (kg)": "Informe o peso total real da mercadoria em quilogramas. Para calcular a cotação, a API recebe o maior valor entre este peso e o peso taxado.",
  "Volume (m³)": "Calculado automaticamente: quantidade × altura × largura × comprimento.",
  "Peso taxado (kg)": "Calculado automaticamente em quilogramas: metro cúbico × 300. Para calcular a cotação, a API recebe o maior valor entre este peso e o peso real.",
  "Altura (m)": "Informe a altura de uma unidade em metros. Junto com quantidade, largura e comprimento, ela calcula o metro cúbico automaticamente. Com 3 m ou mais, a cotação usa a tabela PADRÃO - 3 METROS.",
  "Largura (m)": "Informe a largura de uma unidade em metros. Junto com quantidade, altura e comprimento, ela calcula o metro cúbico automaticamente. Com 3 m ou mais, a cotação usa a tabela PADRÃO - 3 METROS.",
  "Comprimento (m)": "Informe o comprimento de uma unidade em metros. Junto com quantidade, altura e largura, ele calcula o metro cúbico automaticamente. Com 3 m ou mais, a cotação usa a tabela PADRÃO - 3 METROS.",
  "Valor da NF (R$)": "Informe o valor total da nota fiscal em reais.",
  Quantidade: "Informe a quantidade total de caixas, pallets ou demais volumes.",
  "Classificação do produto": "Descreva o produto ou a categoria da mercadoria, se disponível.",
  "Nome": "Informe o nome da pessoa responsável por esta solicitação.",
  "Telefone": "Informe um telefone brasileiro com DDD para contato sobre a operação. A formatação é aplicada automaticamente e aceita até 11 números.",
  "E-mail": "Informe o e-mail que receberá as informações da solicitação.",
  "Observações": "Inclua detalhes úteis para a operação que não aparecem nos demais campos.",
  "Data": "Escolha a data desejada para a coleta.",
  "Horário inicial": "Informe a partir de que horário a coleta pode começar.",
  "Horário final": "Informe até que horário a coleta pode ser realizada.",
  "Referência interna": "Informe um código, pedido ou referência interna para facilitar a identificação.",
  "Chave da NF": "Informe a chave de acesso de 44 dígitos se quiser consultar a nota. A consulta é opcional e não impede o agendamento.",
  "Número da NF": "Informe o número da nota se quiser consultá-la. A consulta é opcional e não impede o agendamento.",
  "Série": "Informe a série da nota fiscal, se houver.",
};

const defaultQuoteValues: QuoteValues = {
  kind: "fractional",
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
  customerCnpj: "",
  pickupLocationCnpj: "",
  senderCnpj: "",
  recipientCnpj: "",
  originName: "",
  originStateCode: "",
  deliveryPostalCode: "",
  deliveryStreet: "",
  deliveryNumber: "",
  deliveryComplement: "",
  deliveryNeighborhood: "",
  deliveryCity: "",
  deliveryStateCode: "",
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
        <HelpTooltip content={help} />
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

function formatCnpj(value: string) {
  const cnpj = digits(value).slice(0, 14);
  if (cnpj.length <= 2) return cnpj;
  if (cnpj.length <= 5) return `${cnpj.slice(0, 2)}.${cnpj.slice(2)}`;
  if (cnpj.length <= 8) return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5)}`;
  if (cnpj.length <= 12) return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8)}`;
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
}

function formatPostalCode(value: string) {
  const postalCode = digits(value).slice(0, 8);
  return postalCode.length <= 5 ? postalCode : `${postalCode.slice(0, 5)}-${postalCode.slice(5)}`;
}

function formatPhone(value: string) {
  const phone = digits(value).slice(0, 11);
  if (phone.length <= 2) return phone.length ? `(${phone}` : "";
  if (phone.length <= 6) return `(${phone.slice(0, 2)}) ${phone.slice(2)}`;
  if (phone.length <= 10) return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)}-${phone.slice(6)}`;
  return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
}

function volumeFromDimensions(quantity: string, height: string, width: string, length: string) {
  const measures = [quantity, height, width, length].map((value) => Number(value.replace(",", ".")));
  return measures.every((value) => Number.isFinite(value) && value > 0)
    ? measures.reduce((total, value) => total * value, 1)
    : null;
}

function quoteApprovalMessage(quote: QuoteResponse["quote"], values: QuoteValues) {
  const reference = quote.sequenceCode || quote.referenceNumber || "registrada";
  const value = quote.price.total === null ? "em análise" : formatCurrency(quote.price.total);
  return [
    "Olá, fiz uma cotação pelo site Rodogarcia e gostaria de aprová-la para seguir com o transporte.",
    `Cotação: ${reference}`,
    `Valor apresentado: ${value}`,
    `Origem: ${values.originName}/${values.originStateCode}`,
    `Destino: ${values.destinationName}/${values.destinationStateCode}`,
  ].join("\n");
}

function isUnservedOriginError(message: string) {
  return message.startsWith("Ainda não atendemos a cidade de origem");
}

function UnservedOriginDialog({
  content,
  open,
  onOpenChange,
}: {
  content: QuoteUnservedOriginContent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(32rem,calc(100%-2rem))] overflow-hidden border-amber-500/25 bg-[linear-gradient(180deg,rgba(255,251,235,0.98)_0%,rgba(255,255,255,1)_100%)] p-0 shadow-[0_30px_80px_rgba(15,23,42,0.2)] sm:max-w-[32rem]" showCloseButton>
        <DialogHeader className="items-center px-6 pb-2 pt-8 text-center sm:px-8">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-white shadow-[0_12px_28px_rgba(217,119,6,0.24)]">
            <WarningCircle size={27} weight="fill" />
          </span>
          <DialogTitle className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">{content.title}</DialogTitle>
          <DialogDescription className="max-w-sm text-center leading-6 text-[var(--color-muted-raw)]">{content.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="mx-0 mb-0 flex-col gap-3 border-0 bg-white/72 px-6 py-5 sm:flex-row sm:justify-between sm:px-8">
          <button type="button" onClick={() => onOpenChange(false)} className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--color-surface-2)]">Revisar origem</button>
          <a href={content.button.url} target={content.button.external ? "_blank" : undefined} rel={content.button.external ? "noopener noreferrer" : undefined} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(5,150,105,0.22)] transition-colors hover:bg-emerald-700"><PaperPlaneTilt size={18} weight="bold" />{content.button.label}</a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EslQuoteForm({
  approvalWhatsappUrl = external.whatsappQuoteApproval,
  unservedOrigin,
}: {
  approvalWhatsappUrl?: string;
  unservedOrigin: QuoteUnservedOriginContent;
}) {
  const { apiRequest } = useApiRequest();
  const [values, setValues] = useState<QuoteValues>(defaultQuoteValues);
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [error, setError] = useState("");
  const [quote, setQuote] = useState<QuoteResponse["quote"] | null>(null);
  const [quoteResultOpen, setQuoteResultOpen] = useState(false);
  const [unservedOriginOpen, setUnservedOriginOpen] = useState(false);
  const [closedMessage, setClosedMessage] = useState("");
  const postalLookupTimer = useRef<number | null>(null);

  const kindLabel = values.kind === "fractional" ? "carga fracionada" : "carga fechada";
  const approvalMessage = quote ? quoteApprovalMessage(quote, values) : "";
  const approvalUrl = quote ? whatsappUrl(approvalWhatsappUrl, approvalMessage) : null;

  function update<K extends keyof QuoteValues>(key: K, value: QuoteValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function updateDimensions(key: "height" | "width" | "length", value: string) {
    setValues((current) => {
      const next = { ...current, [key]: value };
      const calculated = volumeFromDimensions(next.invoiceVolumes, next.height, next.width, next.length);
      return { ...next, cubicVolume: calculated === null ? "" : String(Number(calculated.toFixed(4))) };
    });
  }

  function updateQuantity(value: string) {
    setValues((current) => {
      const next = { ...current, invoiceVolumes: value };
      const calculated = volumeFromDimensions(next.invoiceVolumes, next.height, next.width, next.length);
      return { ...next, cubicVolume: calculated === null ? "" : String(Number(calculated.toFixed(4))) };
    });
  }

  const taxedWeight = Number(values.cubicVolume) > 0 ? Number(values.cubicVolume) * 300 : null;

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

  function input<K extends keyof QuoteValues>(key: K) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      update(key, event.target.value as QuoteValues[K]);
    };
  }

  function formattedInput<K extends "customerCnpj" | "senderCnpj" | "recipientCnpj" | "requesterPhone">(key: K) {
    const formatter = key === "requesterPhone" ? formatPhone : formatCnpj;
    return (event: ChangeEvent<HTMLInputElement>) => {
      update(key, formatter(event.target.value) as QuoteValues[K]);
    };
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError("");
    setQuote(null);
    setClosedMessage("");

    const payload = {
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
      height: values.height,
      width: values.width,
      length: values.length,
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
        if (isUnservedOriginError(reason)) {
          setError("");
          setStatus("idle");
          setUnservedOriginOpen(true);
          dispatchFormTracking("quote", "fail", "unserved_origin");
          return;
        }
        setError(reason);
        setStatus("error");
        dispatchFormTracking("quote", "fail", reason);
        return;
      }
      setQuote(result.data.quote);
      setQuoteResultOpen(true);
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
    <>
      <Dialog open={quoteResultOpen && Boolean(quote)} onOpenChange={setQuoteResultOpen}>
        <DialogContent className="max-w-[min(34rem,calc(100%-2rem))] overflow-hidden border-emerald-500/20 bg-[linear-gradient(180deg,rgba(236,253,245,0.98)_0%,rgba(255,255,255,1)_100%)] p-0 shadow-[0_30px_80px_rgba(15,23,42,0.2)] sm:max-w-[34rem]" showCloseButton>
          <DialogHeader className="items-center px-6 pb-2 pt-8 text-center sm:px-8">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-[0_12px_28px_rgba(5,150,105,0.26)]">
              <CheckCircle size={27} weight="fill" />
            </span>
            <DialogTitle className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">Cotação pronta.</DialogTitle>
            <DialogDescription className="max-w-sm text-center leading-6 text-[var(--color-muted-raw)]">Confira o valor e aprove pelo atendimento para seguir com o transporte.</DialogDescription>
          </DialogHeader>
          {quote ? (
            <div className="space-y-5 px-6 pb-6 pt-4 sm:px-8">
              <div className="rounded-2xl border border-slate-200 bg-white/88 px-5 py-4 text-center shadow-[0_12px_26px_rgba(15,23,42,0.05)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-raw)]">Cotação</p>
                <p className="mt-1 text-lg font-bold text-[var(--foreground)]">{quote.sequenceCode || quote.referenceNumber || "Registrada"}</p>
                <div className="my-4 h-px bg-slate-200" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Valor da cotação</p>
                <p className="mt-1 text-4xl font-bold tracking-[-0.06em] text-[var(--foreground)]">{quote.price.total === null ? "Em análise" : formatCurrency(quote.price.total)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-left text-sm">
                <div className="rounded-xl border border-slate-200/90 bg-white/68 p-3"><p className="text-xs text-[var(--color-muted-raw)]">Origem</p><p className="mt-1 font-semibold text-[var(--foreground)]">{values.originName}/{values.originStateCode}</p></div>
                <div className="rounded-xl border border-slate-200/90 bg-white/68 p-3"><p className="text-xs text-[var(--color-muted-raw)]">Destino</p><p className="mt-1 font-semibold text-[var(--foreground)]">{values.destinationName}/{values.destinationStateCode}</p></div>
              </div>
            </div>
          ) : null}
          <DialogFooter className="mx-0 mb-0 flex-col gap-3 border-0 bg-white/72 px-6 py-5 sm:flex-row sm:justify-between sm:px-8">
            <button type="button" onClick={() => { setValues(defaultQuoteValues); setQuote(null); setQuoteResultOpen(false); setStatus("idle"); }} className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--color-surface-2)]">Fazer outra cotação</button>
            {approvalUrl ? <a href={approvalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(5,150,105,0.22)] transition-colors hover:bg-emerald-700"><PaperPlaneTilt size={18} weight="bold" />Aprovar cotação</a> : <a href={site.contact} className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[var(--primary)] px-5 text-sm font-semibold text-white">Falar com atendimento</a>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UnservedOriginDialog
        content={unservedOrigin}
        open={unservedOriginOpen}
        onOpenChange={(open) => {
          setUnservedOriginOpen(open);
          if (!open) setError("");
        }}
      />

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

      <Fieldset title="Empresas envolvidas" description="Informe o CNPJ da empresa responsável pela operação. A filial Rodogarcia é identificada automaticamente pela cidade de origem." className="lg:col-span-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="CNPJ do cliente e pagador" required><input value={values.customerCnpj} onChange={formattedInput("customerCnpj")} inputMode="numeric" maxLength={18} autoComplete="off" placeholder="00.000.000/0000-00" className={fieldClassName} /></Field>
          <Field label="CNPJ do remetente"><input value={values.senderCnpj} onChange={formattedInput("senderCnpj")} inputMode="numeric" maxLength={18} autoComplete="off" placeholder="00.000.000/0000-00" className={fieldClassName} /></Field>
          <Field label="CNPJ do destinatário"><input value={values.recipientCnpj} onChange={formattedInput("recipientCnpj")} inputMode="numeric" maxLength={18} autoComplete="off" placeholder="00.000.000/0000-00" className={fieldClassName} /></Field>
        </div>
      </Fieldset>

      <Fieldset title="Origem e destino" className="lg:col-span-12">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="CEP de origem" required><input value={values.originPostalCode} onChange={(event) => { const postalCode = formatPostalCode(event.target.value); update("originPostalCode", postalCode); schedulePostalLookup("origin", postalCode); }} onBlur={(event) => void fillCityFromPostalCode("origin", event.currentTarget.value)} inputMode="numeric" maxLength={9} autoComplete="postal-code" placeholder="00000-000" className={fieldClassName} /></Field>
          <Field label="Cidade de origem" required><input value={values.originName} onChange={input("originName")} autoComplete="address-level2" placeholder="Ex.: Osasco" className={fieldClassName} /></Field>
          <Field label="UF de origem" required><input value={values.originStateCode} onChange={input("originStateCode")} maxLength={2} autoComplete="address-level1" placeholder="SP" className={fieldClassName} /></Field>
          <Field label="CEP de destino" required><input value={values.destinationPostalCode} onChange={(event) => { const postalCode = formatPostalCode(event.target.value); update("destinationPostalCode", postalCode); schedulePostalLookup("destination", postalCode); }} onBlur={(event) => void fillCityFromPostalCode("destination", event.currentTarget.value)} inputMode="numeric" maxLength={9} autoComplete="postal-code" placeholder="00000-000" className={fieldClassName} /></Field>
          <Field label="Cidade de destino" required><input value={values.destinationName} onChange={input("destinationName")} autoComplete="address-level2" placeholder="Ex.: Agudos" className={fieldClassName} /></Field>
          <Field label="UF de destino" required><input value={values.destinationStateCode} onChange={input("destinationStateCode")} maxLength={2} autoComplete="address-level1" placeholder="SP" className={fieldClassName} /></Field>
        </div>
      </Fieldset>

      <Fieldset title="Dados da carga" className="lg:col-span-7 lg:self-stretch">
        <div className="grid gap-4 [&>label]:min-w-0 [&>label>span]:whitespace-nowrap">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,0.72fr)_repeat(3,minmax(0,1fr))]">
            <Field label="Quantidade" required><input value={values.invoiceVolumes} onChange={(event) => updateQuantity(event.target.value)} type="number" min="1" step="1" inputMode="numeric" placeholder="1" className={fieldClassName} /></Field>
            <Field label="Altura (m)" required><input value={values.height} onChange={(event) => updateDimensions("height", event.target.value)} type="number" min="0" step="0.01" inputMode="decimal" placeholder="1,2" className={fieldClassName} /></Field>
            <Field label="Largura (m)" required><input value={values.width} onChange={(event) => updateDimensions("width", event.target.value)} type="number" min="0" step="0.01" inputMode="decimal" placeholder="0,8" className={fieldClassName} /></Field>
            <Field label="Comprimento (m)" required><input value={values.length} onChange={(event) => updateDimensions("length", event.target.value)} type="number" min="0" step="0.01" inputMode="decimal" placeholder="2,5" className={fieldClassName} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Volume (m³)" required><input value={values.cubicVolume} readOnly aria-live="polite" placeholder="Calculado automaticamente" className={`${fieldClassName} cursor-default bg-slate-100/90 text-slate-600`} /></Field>
            <Field label="Peso taxado (kg)"><input value={taxedWeight === null ? "" : String(Number(taxedWeight.toFixed(2)))} readOnly aria-live="polite" placeholder="Calculado automaticamente" className={`${fieldClassName} cursor-default bg-slate-100/90 text-slate-600`} /></Field>
            <Field label="Peso real (kg)" required><input value={values.realWeight} onChange={input("realWeight")} type="number" min="0" step="0.01" inputMode="decimal" placeholder="20" className={fieldClassName} /></Field>
            <Field label="Valor da NF (R$)" required><input value={values.invoiceValue} onChange={input("invoiceValue")} type="number" min="0" step="0.01" inputMode="decimal" placeholder="200" className={fieldClassName} /></Field>
          </div>
          <Field label="Classificação do produto"><input value={values.productClassificationName} onChange={input("productClassificationName")} placeholder="Ex.: Produtos químicos" className={fieldClassName} /></Field>
        </div>
      </Fieldset>

      <Fieldset title="Solicitante" className="lg:col-span-5 lg:self-stretch">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome" required><input value={values.requesterName} onChange={input("requesterName")} autoComplete="name" placeholder="Seu nome" className={fieldClassName} /></Field>
          <Field label="Telefone" required><input value={values.requesterPhone} onChange={formattedInput("requesterPhone")} type="tel" inputMode="tel" maxLength={15} autoComplete="tel" placeholder="(00) 00000-0000" className={fieldClassName} /></Field>
          <Field label="E-mail" required><input value={values.requesterEmail} onChange={input("requesterEmail")} type="email" autoComplete="email" placeholder="seu@email.com" className={fieldClassName} /></Field>
          <Field label="Observações"><input value={values.comments} onChange={input("comments")} placeholder="Informações adicionais (opcional)" className={fieldClassName} /></Field>
        </div>
        <div className="flex justify-start border-t border-slate-300/80 pt-5 sm:justify-end">
          <SubmitButton loading={status === "loading"}>{status === "loading" ? "Enviando..." : values.kind === "fractional" ? "Calcular cotação" : `Preparar ${kindLabel}`}</SubmitButton>
        </div>
      </Fieldset>

      {status === "error" ? (
        <div className="space-y-3 lg:col-span-12">
          <Alert kind="error">{error}</Alert>
        </div>
      ) : null}
      </form>
    </>
  );
}

export function EslCollectionForm({ unservedOrigin }: { unservedOrigin: QuoteUnservedOriginContent }) {
  const { apiRequest } = useApiRequest();
  const [values, setValues] = useState<CollectionValues>(defaultCollectionValues);
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [validationStatus, setValidationStatus] = useState<RequestStatus>("idle");
  const [error, setError] = useState("");
  const [invoiceValidationToken, setInvoiceValidationToken] = useState("");
  const [collection, setCollection] = useState<CollectionResponse["collection"] | null>(null);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [companyLookupStatus, setCompanyLookupStatus] = useState<RequestStatus>("idle");
  const [companyLookupMessage, setCompanyLookupMessage] = useState("");
  const [unservedOriginOpen, setUnservedOriginOpen] = useState(false);
  const companyLookupTimer = useRef<number | null>(null);

  const validationFingerprint = useMemo(
    () => [values.customerCnpj, values.pickupLocationCnpj, values.senderCnpj, values.recipientCnpj, values.originName, values.originStateCode, values.invoiceKey, values.invoiceNumber, values.invoiceSeries].join("|"),
    [values.customerCnpj, values.invoiceKey, values.invoiceNumber, values.invoiceSeries, values.originName, values.originStateCode, values.pickupLocationCnpj, values.recipientCnpj, values.senderCnpj]
  );
  const [validatedFingerprint, setValidatedFingerprint] = useState("");
  const isInvoiceCurrent = Boolean(
    invoiceValidationToken && validationFingerprint === validatedFingerprint
  );

  function update<K extends keyof CollectionValues>(key: K, value: CollectionValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    if (["customerCnpj", "pickupLocationCnpj", "senderCnpj", "recipientCnpj", "originName", "originStateCode", "invoiceKey", "invoiceNumber", "invoiceSeries"].includes(key)) {
      setInvoiceValidationToken("");
      setValidatedFingerprint("");
    }
  }

  function updateDeliveryAddress<K extends keyof CollectionValues>(key: K, value: CollectionValues[K]) {
    setValues((current) => {
      const next = { ...current, [key]: value };
      if (key === "deliveryCity") next.originName = value as string;
      if (key === "deliveryStateCode") next.originStateCode = value as string;
      return next;
    });
    if (key === "deliveryCity" || key === "deliveryStateCode") {
      setInvoiceValidationToken("");
      setValidatedFingerprint("");
    }
  }

  async function lookupPickupLocationAddress(rawCnpj: string) {
    const cnpj = digits(rawCnpj);
    if (cnpj.length !== 14) return;
    setCompanyLookupStatus("loading");
    setCompanyLookupMessage("");
    try {
      const response = await fetch(api.public.company(cnpj));
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok || !data || typeof data !== "object") {
        throw new Error("Não foi possível confirmar o endereço pelo CNPJ.");
      }
      const address = data as CompanyAddressResponse;
      setValues((current) => ({
        ...current,
        deliveryPostalCode: address.postalCode,
        deliveryStreet: address.street,
        deliveryNumber: address.number,
        deliveryComplement: address.complement,
        deliveryNeighborhood: address.neighborhood,
        deliveryCity: address.city,
        deliveryStateCode: address.stateCode,
        originName: address.city,
        originStateCode: address.stateCode,
      }));
      setInvoiceValidationToken("");
      setValidatedFingerprint("");
      setCompanyLookupStatus("success");
      setCompanyLookupMessage("Endereço confirmado pelo CNPJ. Confira os dados antes de solicitar.");
    } catch {
      setCompanyLookupStatus("error");
      setCompanyLookupMessage("Não foi possível confirmar pelo CNPJ. Preencha o endereço manualmente.");
    }
  }

  function schedulePickupLocationLookup(rawCnpj: string) {
    if (companyLookupTimer.current) window.clearTimeout(companyLookupTimer.current);
    if (digits(rawCnpj).length !== 14) {
      setCompanyLookupStatus("idle");
      setCompanyLookupMessage("");
      return;
    }
    companyLookupTimer.current = window.setTimeout(() => {
      void lookupPickupLocationAddress(rawCnpj);
    }, 350);
  }

  async function fillDeliveryCityFromPostalCode(rawPostalCode: string) {
    const postalCode = digits(rawPostalCode);
    if (postalCode.length !== 8) return;
    try {
      const response = await fetch(api.public.postalCode(postalCode));
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok || !data || typeof data !== "object") return;
      const address = data as { city?: unknown; stateCode?: unknown };
      const city = typeof address.city === "string" ? address.city : "";
      const stateCode = typeof address.stateCode === "string" ? address.stateCode : "";
      if (!city || !stateCode) return;
      setValues((current) => ({
        ...current,
        deliveryCity: city,
        deliveryStateCode: stateCode,
        originName: city,
        originStateCode: stateCode,
      }));
      setInvoiceValidationToken("");
      setValidatedFingerprint("");
    } catch {
      // O endereço manual continua disponível quando a consulta de CEP falha.
    }
  }

  function input<K extends keyof CollectionValues>(key: K) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      update(key, event.target.value as CollectionValues[K]);
    };
  }

  function formattedInput<K extends "customerCnpj" | "pickupLocationCnpj" | "senderCnpj" | "recipientCnpj">(key: K) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      update(key, formatCnpj(event.target.value) as CollectionValues[K]);
    };
  }

  async function validateInvoice() {
    setValidationStatus("loading");
    setError("");
    setInvoiceValidationToken("");
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
    setInvoiceValidationToken(result.data.validationToken);
    setValidatedFingerprint(validationFingerprint);
    setValidationStatus("success");
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError("");
    setValidationStatus("idle");
    setCollection(null);
    setWhatsappMessage("");

    const result = await apiRequest<CollectionResponse | CollectionWhatsappResponse>(api.eslTransport.collections, {
      method: "POST",
      body: JSON.stringify({
        customerCnpj: values.customerCnpj,
        pickupLocationCnpj: values.pickupLocationCnpj,
        senderCnpj: values.senderCnpj,
        recipientCnpj: values.recipientCnpj,
        origin: {
          name: values.originName,
          stateCode: values.originStateCode,
        },
        deliveryAddress: {
          postalCode: values.deliveryPostalCode,
          street: values.deliveryStreet,
          number: values.deliveryNumber,
          complement: values.deliveryComplement,
          neighborhood: values.deliveryNeighborhood,
          city: values.deliveryCity,
          stateCode: values.deliveryStateCode,
        },
        serviceDate: values.serviceDate,
        serviceStartHour: values.serviceStartHour,
        serviceEndHour: values.serviceEndHour,
        invoiceValidationToken: isInvoiceCurrent ? invoiceValidationToken : "",
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
      if (isUnservedOriginError(reason)) {
        setError("");
        setStatus("idle");
        setUnservedOriginOpen(true);
        dispatchFormTracking("collection", "fail", "unserved_origin");
        return;
      }
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
        <button type="button" onClick={() => { setValues(defaultCollectionValues); setInvoiceValidationToken(""); setValidatedFingerprint(""); setStatus("idle"); }} className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--color-surface-2)]">Solicitar outra coleta</button>
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
    <>
      <UnservedOriginDialog
        content={unservedOrigin}
        open={unservedOriginOpen}
        onOpenChange={(open) => {
          setUnservedOriginOpen(open);
          if (!open) setError("");
        }}
      />
      <form onSubmit={(event) => void onSubmit(event)} className="grid gap-5 lg:grid-cols-12 lg:items-start" noValidate>
      <div className="flex flex-col gap-2 rounded-[28px] border border-blue-200/80 bg-[linear-gradient(135deg,rgba(239,246,255,0.98)_0%,rgba(219,234,254,0.82)_100%)] p-5 shadow-[0_18px_42px_rgba(30,64,175,0.08)] sm:flex-row sm:items-end sm:justify-between sm:p-6 lg:col-span-12">
        <div>
          <p className={sectionTitleClassName}>Agendamento de coleta</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">Registre a coleta com os dados da NF.</h2>
        </div>
        <span className="w-fit rounded-full border border-[var(--border)] bg-white/74 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-raw)]">NF opcional</span>
      </div>

      <Fieldset title="Cadastros da operação" description="O cliente precisa estar cadastrado no ESL. O mesmo CNPJ é usado como cliente e pagador; a filial é identificada pela cidade de origem. Para validar uma NF, informe também o CNPJ do remetente ou do destinatário que consta nela." className="lg:col-span-12">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Field label="CNPJ do cliente e pagador" required><input value={values.customerCnpj} onChange={formattedInput("customerCnpj")} inputMode="numeric" maxLength={18} autoComplete="off" placeholder="00.000.000/0000-00" className={fieldClassName} /></Field>
          <Field label="CNPJ do local de coleta" required><input value={values.pickupLocationCnpj} onChange={(event) => { const cnpj = formatCnpj(event.target.value); update("pickupLocationCnpj", cnpj); schedulePickupLocationLookup(cnpj); }} onBlur={(event) => void lookupPickupLocationAddress(event.currentTarget.value)} inputMode="numeric" maxLength={18} autoComplete="off" placeholder="00.000.000/0000-00" className={fieldClassName} /></Field>
          <Field label="CNPJ do remetente"><input value={values.senderCnpj} onChange={formattedInput("senderCnpj")} inputMode="numeric" maxLength={18} autoComplete="off" placeholder="Opcional" className={fieldClassName} /></Field>
          <Field label="CNPJ do destinatário"><input value={values.recipientCnpj} onChange={formattedInput("recipientCnpj")} inputMode="numeric" maxLength={18} autoComplete="off" placeholder="Opcional" className={fieldClassName} /></Field>
          <Field label="Cidade de origem" required><input value={values.originName} onChange={input("originName")} autoComplete="address-level2" placeholder="Ex.: Osasco" className={fieldClassName} /></Field>
          <Field label="UF de origem" required><input value={values.originStateCode} onChange={input("originStateCode")} maxLength={2} autoComplete="address-level1" placeholder="SP" className={fieldClassName} /></Field>
        </div>
      </Fieldset>

      <Fieldset title="Endereço de entrega" description="O endereço é confirmado automaticamente quando o CNPJ do local de coleta for localizado. Se não for, preencha ou ajuste os campos abaixo antes de solicitar." className="lg:col-span-12">
        <div className="grid gap-4 sm:grid-cols-6">
          <Field label="CEP de entrega" className="sm:col-span-1"><input value={values.deliveryPostalCode} onChange={(event) => { const postalCode = formatPostalCode(event.target.value); updateDeliveryAddress("deliveryPostalCode", postalCode); void fillDeliveryCityFromPostalCode(postalCode); }} onBlur={(event) => void fillDeliveryCityFromPostalCode(event.currentTarget.value)} inputMode="numeric" maxLength={9} autoComplete="postal-code" placeholder="00000-000" className={fieldClassName} /></Field>
          <Field label="Logradouro" className="sm:col-span-3"><input value={values.deliveryStreet} onChange={(event) => updateDeliveryAddress("deliveryStreet", event.target.value)} autoComplete="address-line1" placeholder="Rua, avenida ou estrada" className={fieldClassName} /></Field>
          <Field label="Número" className="sm:col-span-1"><input value={values.deliveryNumber} onChange={(event) => updateDeliveryAddress("deliveryNumber", event.target.value)} autoComplete="address-line2" placeholder="Número" className={fieldClassName} /></Field>
          <Field label="Complemento" className="sm:col-span-1"><input value={values.deliveryComplement} onChange={(event) => updateDeliveryAddress("deliveryComplement", event.target.value)} autoComplete="address-line2" placeholder="Opcional" className={fieldClassName} /></Field>
          <Field label="Bairro" className="sm:col-span-2"><input value={values.deliveryNeighborhood} onChange={(event) => updateDeliveryAddress("deliveryNeighborhood", event.target.value)} autoComplete="address-level3" placeholder="Bairro" className={fieldClassName} /></Field>
          <Field label="Cidade de entrega" className="sm:col-span-3"><input value={values.deliveryCity} onChange={(event) => updateDeliveryAddress("deliveryCity", event.target.value)} autoComplete="address-level2" placeholder="Cidade" className={fieldClassName} /></Field>
          <Field label="UF de entrega" className="sm:col-span-1"><input value={values.deliveryStateCode} onChange={(event) => updateDeliveryAddress("deliveryStateCode", event.target.value)} maxLength={2} autoComplete="address-level1" placeholder="UF" className={fieldClassName} /></Field>
        </div>
        {companyLookupStatus === "loading" ? <p className="mt-4 text-sm text-[var(--color-muted-raw)]">Confirmando o endereço do CNPJ...</p> : null}
        {companyLookupMessage ? <p className={`mt-4 text-sm ${companyLookupStatus === "success" ? "text-emerald-700" : "text-amber-700"}`}>{companyLookupMessage}</p> : null}
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

      <Fieldset title="Nota fiscal" description="A consulta é opcional. Para confirmar uma NF, informe a chave ou o número e o CNPJ do remetente ou destinatário correspondente. O agendamento continua disponível sem NF." className="lg:col-span-7 lg:self-stretch">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Chave da NF"><input value={values.invoiceKey} onChange={input("invoiceKey")} inputMode="numeric" autoComplete="off" placeholder="44 dígitos" className={fieldClassName} /></Field>
          <Field label="Número da NF"><input value={values.invoiceNumber} onChange={input("invoiceNumber")} autoComplete="off" placeholder="Ex.: 12345" className={fieldClassName} /></Field>
          <Field label="Série"><input value={values.invoiceSeries} onChange={input("invoiceSeries")} autoComplete="off" placeholder="Ex.: 1" className={fieldClassName} /></Field>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={() => void validateInvoice()} disabled={validationStatus === "loading"} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(29,78,216,0.2)] transition-colors hover:bg-[var(--color-primary-strong)] disabled:cursor-not-allowed disabled:opacity-60">
            {validationStatus === "loading" ? <SpinnerGap size={17} className="animate-spin" weight="bold" /> : <ClipboardText size={17} weight="bold" />}
            {validationStatus === "loading" ? "Consultando..." : "Consultar NF"}
          </button>
          {isInvoiceCurrent ? <span className="text-sm font-semibold text-emerald-700">NF confirmada</span> : <span className="text-xs text-[var(--color-muted-raw)]">Você pode solicitar a coleta sem consultar a NF.</span>}
        </div>
        <div className="grid gap-4 border-t border-slate-300/80 pt-5">
          {status === "error" || validationStatus === "error" ? <Alert kind="error">{error}</Alert> : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <SubmitButton loading={status === "loading"} className="shrink-0">{status === "loading" ? "Solicitando..." : "Solicitar coleta"}</SubmitButton>
          </div>
        </div>
      </Fieldset>
      </form>
    </>
  );
}

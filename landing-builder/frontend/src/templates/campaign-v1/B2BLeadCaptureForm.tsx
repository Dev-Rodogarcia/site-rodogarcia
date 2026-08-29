"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";

type FormValues = {
  name: string;
  email: string;
  phone: string;
  cnpj: string;
  companyLocation: string;
  warehouseLocation: string;
  notes: string;
  privacyAccepted: boolean;
};

const emptyForm: FormValues = { name: "", email: "", phone: "", cnpj: "", companyLocation: "", warehouseLocation: "", notes: "", privacyAccepted: false };
const inputStyle = { width: "100%", boxSizing: "border-box" as const, border: "1px solid rgba(255,255,255,.18)", borderRadius: 10, padding: "12px 13px", color: "#111827", background: "#ffffff", font: "inherit", fontSize: 14 };

function digits(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function formatPhone(value: string) {
  const phone = digits(value, 11);
  if (phone.length <= 2) return phone ? `(${phone}` : "";
  if (phone.length <= 6) return `(${phone.slice(0, 2)}) ${phone.slice(2)}`;
  if (phone.length <= 10) return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)}-${phone.slice(6)}`;
  return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
}

function formatCnpj(value: string) {
  const cnpj = digits(value, 14);
  return cnpj
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2}\.\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{2}\.\d{3}\.\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function campaignUtms() {
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get("utm_source") ?? "",
    utmMedium: params.get("utm_medium") ?? "",
    utmCampaign: params.get("utm_campaign") ?? "",
  };
}

export function B2BLeadCaptureForm({ title, description, submitLabel, panelColor, buttonColor, buttonTextColor, preview = false }: { title: string; description: string; submitLabel: string; panelColor: string; buttonColor: string; buttonTextColor: string; preview?: boolean }) {
  const [values, setValues] = useState<FormValues>(emptyForm);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  function updateField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handlePhoneChange(event: ChangeEvent<HTMLInputElement>) {
    updateField("phone", formatPhone(event.target.value));
  }

  function handleCnpjChange(event: ChangeEvent<HTMLInputElement>) {
    updateField("cnpj", formatCnpj(event.target.value));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    if (preview) {
      setStatus("success");
      setMessage("Na landing publicada, esta solicitação será enviada à base de Leads.");
      return;
    }

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "landing-b2b-form",
          pagePath: window.location.pathname,
          origin: "campaign-v1",
          name: values.name,
          email: values.email,
          phone: values.phone,
          cnpj: digits(values.cnpj, 14),
          companyLocation: values.companyLocation,
          warehouseLocation: values.warehouseLocation,
          notes: values.notes,
          privacyAccepted: values.privacyAccepted,
          ...campaignUtms(),
        }),
      });
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Não foi possível enviar sua solicitação agora.");

      setValues(emptyForm);
      setStatus("success");
      setMessage("Recebemos sua solicitação. Nossa equipe entrará em contato em breve.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Erro de conexão. Tente novamente.");
    }
  }

  return <form onSubmit={(event) => void submit(event)} style={{ borderRadius: 28, padding: "clamp(24px, 4vw, 40px)", color: "#ffffff", background: panelColor, boxShadow: "0 24px 64px rgba(17,17,17,.18)" }}>
    <h2 style={{ margin: 0, fontSize: "clamp(1.55rem, 3vw, 2.25rem)", lineHeight: 1.02, letterSpacing: "-.04em", textTransform: "uppercase" }}>{title}</h2>
    {description ? <p style={{ margin: "14px 0 24px", color: "rgba(255,255,255,.8)", fontSize: 15, fontStyle: "italic", lineHeight: 1.55 }}>{description}</p> : null}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 12 }}>
      <input value={values.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Nome" aria-label="Nome" autoComplete="name" maxLength={80} required style={inputStyle} />
      <input value={values.email} onChange={(event) => updateField("email", event.target.value)} placeholder="E-mail corporativo" aria-label="E-mail corporativo" autoComplete="email" type="email" maxLength={160} required style={inputStyle} />
      <input value={values.phone} onChange={handlePhoneChange} placeholder="Telefone" aria-label="Telefone" autoComplete="tel" inputMode="tel" required style={inputStyle} />
      <input value={values.cnpj} onChange={handleCnpjChange} placeholder="CNPJ" aria-label="CNPJ" inputMode="numeric" required style={inputStyle} />
      <input value={values.companyLocation} onChange={(event) => updateField("companyLocation", event.target.value)} placeholder="Local da empresa" aria-label="Local da empresa" maxLength={140} style={inputStyle} />
      <input value={values.warehouseLocation} onChange={(event) => updateField("warehouseLocation", event.target.value)} placeholder="Localização desejada" aria-label="Localização desejada" maxLength={140} style={inputStyle} />
    </div>
    <textarea value={values.notes} onChange={(event) => updateField("notes", event.target.value)} placeholder="Observações: quantidade, características dos produtos e necessidade da operação" aria-label="Observações da demanda" maxLength={180} rows={4} style={{ ...inputStyle, marginTop: 12, minHeight: 104, resize: "vertical" }} />
    <label style={{ display: "flex", alignItems: "flex-start", gap: 9, marginTop: 16, color: "rgba(255,255,255,.9)", fontSize: 13, lineHeight: 1.45 }}><input checked={values.privacyAccepted} onChange={(event) => updateField("privacyAccepted", event.target.checked)} type="checkbox" required style={{ marginTop: 3, accentColor: "#ffffff" }} /><span>Declaro que li e concordo com a <a href="/privacidade" style={{ color: "#ffffff" }}>Política de Privacidade</a>.</span></label>
    <button type="submit" disabled={status === "submitting"} style={{ width: "100%", marginTop: 18, border: 0, borderRadius: 999, padding: "15px 20px", color: buttonTextColor, background: buttonColor, font: "inherit", fontSize: 14, fontWeight: 800, textTransform: "uppercase", cursor: status === "submitting" ? "wait" : "pointer", opacity: status === "submitting" ? .7 : 1 }}>{status === "submitting" ? "Enviando..." : submitLabel || "Receber solução personalizada"}</button>
    {message ? <p role="status" style={{ margin: "14px 0 0", color: status === "error" ? "#fecaca" : "#d1fae5", fontSize: 13, lineHeight: 1.45 }}>{message}</p> : null}
  </form>;
}

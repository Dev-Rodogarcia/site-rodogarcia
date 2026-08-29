"use client";

import { useState } from "react";
import type { PublicLandingPage } from "@/lib/landing";

type Faq = PublicLandingPage["faq"];
type Theme = PublicLandingPage["theme"];

/** Mantém uma única resposta visível para a leitura não ficar fragmentada. */
export function CampaignV1Faq({ faq, theme, sectionDivider, contentPadding }: { faq: Faq; theme: Theme; sectionDivider: string; contentPadding: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(faq.items.length > 0 ? 0 : null);

  return <section style={{ borderTop: sectionDivider, padding: `clamp(76px, 10vw, 124px) ${contentPadding}`, background: theme.backgroundColor }}><div style={{ maxWidth: 980, margin: "0 auto" }}><div style={{ textAlign: "center" }}><p style={{ color: theme.primaryColor, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".14em", fontSize: 12, margin: 0 }}>{faq.eyebrow}</p><h2 style={{ margin: "14px 0 0", fontSize: "clamp(2rem, 4vw, 3.75rem)", lineHeight: .98, letterSpacing: "-.045em", textTransform: "uppercase" }}>{faq.title}</h2></div><div style={{ display: "grid", gap: 14, marginTop: 42 }}>{faq.items.map((item, index) => {
    const isOpen = openIndex === index;

    return <article key={`${item.question}-${index}`} style={{ overflow: "hidden", border: `2px solid ${theme.primaryColor}`, borderRadius: 18, background: isOpen ? theme.primaryColor : theme.backgroundColor, color: isOpen ? theme.backgroundColor : theme.textColor }}><button type="button" aria-expanded={isOpen} onClick={() => setOpenIndex((currentIndex) => currentIndex === index ? null : index)} style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", gap: 20, cursor: "pointer", border: 0, background: "transparent", color: "inherit", padding: "20px 24px", fontWeight: 800, fontSize: "1.05rem", textAlign: "left" }}><span>{item.question}</span><span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1 }}>{isOpen ? "⌃" : "⌄"}</span></button>{isOpen ? <p style={{ maxWidth: 780, margin: "0", padding: "0 24px 24px", lineHeight: 1.7, opacity: .84 }}>{item.answer}</p> : null}</article>;
  })}</div></div></section>;
}

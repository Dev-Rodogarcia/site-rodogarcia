import type { QuickAction } from "../types/content.js";

export function defaultHomeQuickActions(): QuickAction[] {
  return [
    { id: "qa-taxas", order: 1, label: "Taxas", href: "", icon: "FilePdf", type: "download", enabled: false, downloadFile: "" },
    { id: "qa-cotacao", order: 2, label: "Cotação", href: "/cotacao", icon: "Calculator", type: "link", enabled: true },
    { id: "qa-rastreamento", order: 3, label: "Rastreamento", href: "https://rodogarcia.eslcloud.com.br/recipient_tracking", icon: "MagnifyingGlass", type: "external", enabled: true },
    { id: "qa-coleta", order: 4, label: "Solicitar Coleta", href: "/coletas", icon: "Truck", type: "link", enabled: true },
    { id: "qa-cidades", order: 5, label: "Cidades", href: "#mapa-regional", icon: "MapPin", type: "modal", enabled: true },
    { id: "qa-whatsapp", order: 6, label: "WhatsApp", href: "/fale-conosco", icon: "WhatsappLogo", type: "link", enabled: true },
    { id: "qa-telefone", order: 7, label: "Telefone", href: "tel:08005914557", icon: "Phone", type: "external", enabled: true },
    { id: "qa-email", order: 8, label: "E-mail", href: "mailto:gerente.financeiro@rodogarcia.com.br", icon: "Envelope", type: "external", enabled: true },
  ];
}

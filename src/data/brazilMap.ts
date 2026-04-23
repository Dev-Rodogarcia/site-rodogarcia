/**
 * Brazil map data — ported verbatim from src/js/mapas/mapeamento.js + filiais.js + config.js
 *
 * The SVG has malformed path IDs (states are assigned in the wrong order), so we use
 * an index-to-state mapping to identify which path index corresponds to which state.
 */

// ── Index → state mapping ──────────────────────────────────────────────────
// The IDs in the SVG are assigned in the wrong order.
// This maps: which INDEX in the array of paths corresponds to which real state.
export const MAPEAMENTO_INDICE_PARA_ESTADO: Record<number, string> = {
  // Norte
  0: "ro", // Rondônia
  1: "ac", // Acre
  2: "am", // Amazonas
  3: "rr", // Roraima
  4: "ap", // Amapá
  21: "pa", // Pará
  6: "mt", // Mato Grosso
  5: "to", // Tocantins

  // Nordeste
  20: "ma", // Maranhão
  13: "pi", // Piauí
  14: "ce", // Ceará
  15: "rn", // Rio Grande do Norte
  19: "pe", // Pernambuco
  16: "al", // Alagoas
  17: "se", // Sergipe
  12: "ba", // Bahia
  9: "mg", // Minas Gerais
  26: "pb", // Paraíba

  // Centro-Oeste
  8: "ms", // Mato Grosso do Sul
  10: "pr", // Paraná

  // Sudeste
  22: "sp", // São Paulo
  24: "es", // Espírito Santo
  23: "rj", // Rio de Janeiro

  // Sul
  25: "sc", // Santa Catarina
  11: "rs", // Rio Grande do Sul
};

export function getIndicePorEstado(estadoId: string): number | null {
  const entry = Object.entries(MAPEAMENTO_INDICE_PARA_ESTADO).find(
    ([, v]) => v === estadoId.toLowerCase()
  );
  return entry ? parseInt(entry[0]) : null;
}

export function getEstadoPorIndice(índice: number): string | null {
  return MAPEAMENTO_INDICE_PARA_ESTADO[índice] ?? null;
}

// ── Colors ─────────────────────────────────────────────────────────────────
export const CORES = {
  base: "#A9D4EF",
  destaque: "#2E2882",
  hover: "#414D82",
  stroke: "#ffffff",
  strokeWidthNormal: "1.5",
  strokeWidthDestacado: "2",
} as const;

// ── States with branches ───────────────────────────────────────────────────
export const ESTADOS_COM_FILIAIS = ["sp", "pe", "pr", "rj", "rs"] as const;

// ── Branch data ────────────────────────────────────────────────────────────
export interface Filial {
  id: string;
  nome: string;
  endereco: string;
  telefone: string;
  email: string;
  estado: string;
}

export const FILIAIS: Filial[] = [
  {
    id: "matriz",
    nome: "Matriz - Agudos/SP",
    endereco: "Rua Pedro Carmine Deo, 156, Agudos, SP - 17123-210",
    telefone: "0800 591 4557",
    email: "gerente.financeiro@rodogarcia.com.br",
    estado: "sp",
  },
  {
    id: "agudos",
    nome: "Agudos/SP",
    endereco: "Rua Pedro Carmine Deo, 156, Agudos, SP - 17123-210",
    telefone: "0800 591 4557",
    email: "agudos@rodogarcia.com.br",
    estado: "sp",
  },
  {
    id: "campinas",
    nome: "Campinas/SP",
    endereco: "Campinas, São Paulo",
    telefone: "(19) 3XXX-XXXX",
    email: "campinas@rodogarcia.com.br",
    estado: "sp",
  },
  {
    id: "osasco",
    nome: "Osasco/SP",
    endereco: "Osasco, São Paulo",
    telefone: "(11) 3XXX-XXXX",
    email: "osasco@rodogarcia.com.br",
    estado: "sp",
  },
  {
    id: "castro",
    nome: "Castro/PR",
    endereco: "Castro, Paraná",
    telefone: "(42) 3XXX-XXXX",
    email: "castro@rodogarcia.com.br",
    estado: "pr",
  },
  {
    id: "curitiba",
    nome: "Curitiba/PR",
    endereco: "Curitiba, Paraná",
    telefone: "(41) 3XXX-XXXX",
    email: "curitiba@rodogarcia.com.br",
    estado: "pr",
  },
  {
    id: "rio",
    nome: "Rio de Janeiro/RJ",
    endereco: "Rio de Janeiro, RJ",
    telefone: "(21) 3XXX-XXXX",
    email: "rj@rodogarcia.com.br",
    estado: "rj",
  },
  {
    id: "hamburgo",
    nome: "Novo Hamburgo/RS",
    endereco: "Novo Hamburgo, Rio Grande do Sul",
    telefone: "(51) 3XXX-XXXX",
    email: "hamburgo@rodogarcia.com.br",
    estado: "rs",
  },
  {
    id: "recife",
    nome: "Recife/PE",
    endereco: "Recife, Pernambuco",
    telefone: "(81) 3XXX-XXXX",
    email: "recife@rodogarcia.com.br",
    estado: "pe",
  },
];

export function getFilial(filialId: string): Filial | null {
  return FILIAIS.find((f) => f.id === filialId) ?? null;
}

export function getFiliaisPorEstado(estadoId: string): Filial[] {
  return FILIAIS.filter((f) => f.estado === estadoId.toLowerCase());
}

export const SVG_PATH = "/map.svg";

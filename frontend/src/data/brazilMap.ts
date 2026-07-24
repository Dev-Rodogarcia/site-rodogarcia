/**
 * The Brazil SVG uses path order instead of reliable state ids. This file keeps
 * only structural map metadata; operational unit content comes from the CMS.
 */

export const MAPEAMENTO_INDICE_PARA_ESTADO: Record<number, string> = {
  0: "ro",
  1: "ac",
  2: "am",
  3: "rr",
  4: "ap",
  21: "pa",
  6: "mt",
  5: "to",
  20: "ma",
  13: "pi",
  14: "ce",
  15: "rn",
  19: "pe",
  16: "al",
  17: "se",
  12: "ba",
  9: "mg",
  26: "pb",
  8: "ms",
  10: "pr",
  22: "sp",
  24: "es",
  23: "rj",
  25: "sc",
  11: "rs",
};

export function getIndicePorEstado(estadoId: string): number | null {
  const entry = Object.entries(MAPEAMENTO_INDICE_PARA_ESTADO).find(
    ([, value]) => value === estadoId.toLowerCase()
  );
  return entry ? Number.parseInt(entry[0], 10) : null;
}

export const CORES = {
  base: "#A9D4EF",
  destaque: "#2E2882",
  hover: "#414D82",
  selected: "#1D4ED8",
  stroke: "#ffffff",
  strokeWidthNormal: "1.5",
  strokeWidthDestacado: "2",
  strokeWidthSelected: "3",
} as const;

export const SVG_PATH = "/map.svg";

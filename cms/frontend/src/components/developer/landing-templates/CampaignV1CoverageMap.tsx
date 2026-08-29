"use client";

import { useEffect, useRef, useState } from "react";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const SAFE_TAGS = new Set(["svg", "g", "path"]);
const SAFE_ATTRIBUTES = new Set(["aria-hidden", "class", "d", "fill", "fill-rule", "id", "opacity", "preserveaspectratio", "role", "stroke", "stroke-linecap", "stroke-linejoin", "stroke-width", "transform", "viewbox"]);
// `map.svg` mantém ids legados. A ordem dos paths é o contrato do mapa
// institucional: PR (10), RS (11), PE (19), SP (22) e RJ (23).
const BRANCH_PATH_INDICES: ReadonlySet<number> = new Set([10, 11, 19, 22, 23]);
// Mesmos tokens de `site/frontend/src/data/brazilMap.ts`.
const DEFAULT_MAP_COLORS = { baseColor: "#A9D4EF", branchColor: "#2E2882", borderColor: "#FFFFFF" } as const;

type CoverageMapColors = {
  baseColor: string;
  branchColor: string;
  borderColor: string;
};

function cloneSafeElement(source: Element): SVGElement | null {
  const tag = source.localName.toLowerCase();
  if (!SAFE_TAGS.has(tag)) return null;

  const element = document.createElementNS(SVG_NAMESPACE, tag);
  for (const attribute of Array.from(source.attributes)) {
    if (SAFE_ATTRIBUTES.has(attribute.name.toLowerCase())) element.setAttribute(attribute.name, attribute.value);
  }
  for (const child of Array.from(source.children)) {
    const safeChild = cloneSafeElement(child);
    if (safeChild) element.appendChild(safeChild);
  }
  return element;
}

function createCoverageMap(svgText: string, colors: CoverageMapColors): SVGSVGElement | null {
  const parsed = new DOMParser().parseFromString(svgText, "image/svg+xml");
  const source = parsed.documentElement;
  if (parsed.querySelector("parsererror") || source.localName.toLowerCase() !== "svg" || source.namespaceURI !== SVG_NAMESPACE) return null;

  const map = cloneSafeElement(source);
  if (!(map instanceof SVGSVGElement) || !map.querySelector("path")) return null;

  map.setAttribute("viewBox", map.getAttribute("viewBox") || "0 0 220000 194010");
  map.removeAttribute("width");
  map.removeAttribute("height");
  map.setAttribute("role", "img");
  map.setAttribute("aria-label", "Mapa do Brasil com filiais da Rodogarcia destacadas");
  map.style.display = "block";
  map.style.width = "100%";
  map.style.height = "auto";

  for (const [index, path] of Array.from(map.querySelectorAll<SVGPathElement>("path")).entries()) {
    const highlighted = BRANCH_PATH_INDICES.has(index);
    path.setAttribute("fill", highlighted ? colors.branchColor : colors.baseColor);
    path.setAttribute("stroke", colors.borderColor);
    path.setAttribute("stroke-width", highlighted ? "2" : "1.5");
    path.setAttribute("stroke-linejoin", "round");
  }

  return map;
}

/** Versão sanitizada do mapa para a prévia do CMS, com os estados de filiais destacados. */
function applyCoverageColors(map: SVGSVGElement, colors: CoverageMapColors) {
  for (const [index, path] of Array.from(map.querySelectorAll<SVGPathElement>("path")).entries()) {
    const highlighted = BRANCH_PATH_INDICES.has(index);
    path.setAttribute("fill", highlighted ? colors.branchColor : colors.baseColor);
    path.setAttribute("stroke", colors.borderColor);
  }
}

export function CampaignV1CoverageMap({ compact, colors = DEFAULT_MAP_COLORS }: { compact: boolean; colors?: CoverageMapColors }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<SVGSVGElement | null>(null);
  const colorsRef = useRef<CoverageMapColors>(colors);
  const [state, setState] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    let cancelled = false;
    let container: HTMLDivElement | null = null;

    void fetch("/map.svg")
      .then((response) => {
        if (!response.ok) throw new Error("map unavailable");
        return response.text();
      })
      .then((svgText) => {
        if (cancelled || !containerRef.current) return;
        const map = createCoverageMap(svgText, colorsRef.current);
        if (!map) throw new Error("invalid map");
        container = containerRef.current;
        container.replaceChildren(map);
        mapRef.current = map;
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("unavailable");
      });

    return () => {
      cancelled = true;
      container?.replaceChildren();
      if (mapRef.current) mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    colorsRef.current = colors;
    if (mapRef.current) applyCoverageColors(mapRef.current, colors);
  }, [colors.baseColor, colors.borderColor, colors.branchColor]);

  return <div className={`mx-auto grid w-full place-items-center overflow-hidden ${compact ? "py-1" : "py-1"}`}>
    {state === "loading" ? <span className={compact ? "text-[7px] text-slate-400" : "text-xs text-slate-400"}>Carregando mapa de cobertura...</span> : null}
    {state === "unavailable" ? <div className={compact ? "grid min-h-28 w-full place-items-center rounded-md border border-sky-200 bg-sky-50 text-[8px] font-bold text-sky-700" : "grid min-h-56 w-full place-items-center rounded-xl border border-sky-200 bg-sky-50 text-sm font-bold text-sky-700"}>Cobertura nacional</div> : null}
    <div ref={containerRef} style={{ display: state === "ready" ? "block" : "none", width: compact ? "68%" : "min(100%, 460px)" }} />
  </div>;
}

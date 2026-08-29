"use client";

import { useEffect, useRef, useState } from "react";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const SAFE_TAGS = new Set(["svg", "g", "path"]);
const SAFE_ATTRIBUTES = new Set(["aria-hidden", "class", "d", "fill", "fill-rule", "id", "opacity", "preserveaspectratio", "role", "stroke", "stroke-linecap", "stroke-linejoin", "stroke-width", "transform", "viewbox"]);
// `map.svg` mantém ids legados, que não correspondem à forma do estado.
// A ordem abaixo é o contrato canônico já usado pelo mapa institucional.
const BRANCH_PATH_INDICES: ReadonlySet<number> = new Set([10, 11, 19, 22, 23]);
// Mesmos tokens de `site/frontend/src/data/brazilMap.ts`.
const DEFAULT_MAP_COLORS = { baseColor: "#A9D4EF", branchColor: "#2E2882", borderColor: "#FFFFFF" } as const;

export type BrazilCoverageMapColors = {
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

function parseCoverageMap(svgText: string): SVGSVGElement | null {
  const parsed = new DOMParser().parseFromString(svgText, "image/svg+xml");
  const source = parsed.documentElement;
  if (parsed.querySelector("parsererror") || source.localName.toLowerCase() !== "svg" || source.namespaceURI !== SVG_NAMESPACE) return null;

  const svg = cloneSafeElement(source);
  return svg instanceof SVGSVGElement && svg.querySelector("path") ? svg : null;
}

function applyCoverageColors(svg: SVGSVGElement, colors: BrazilCoverageMapColors) {
  svg.setAttribute("viewBox", svg.getAttribute("viewBox") || "0 0 220000 194010");
  svg.removeAttribute("width");
  svg.removeAttribute("height");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Mapa de cobertura no Brasil");
  svg.style.width = "100%";
  svg.style.height = "auto";
  svg.style.display = "block";

  for (const [index, path] of Array.from(svg.querySelectorAll<SVGPathElement>("path")).entries()) {
    const highlighted = BRANCH_PATH_INDICES.has(index);
    path.setAttribute("fill", highlighted ? colors.branchColor : colors.baseColor);
    path.setAttribute("stroke", colors.borderColor);
    path.setAttribute("stroke-width", highlighted ? "2" : "1.5");
    path.setAttribute("stroke-linejoin", "round");
  }
}

/** Mapa decorativo e seguro da cobertura nacional do campaign-v1. */
export function BrazilCoverageMap({ colors = DEFAULT_MAP_COLORS }: { colors?: BrazilCoverageMapColors }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<SVGSVGElement | null>(null);
  const colorsRef = useRef<BrazilCoverageMapColors>(colors);
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
        const map = parseCoverageMap(svgText);
        if (!map) throw new Error("invalid map");
        applyCoverageColors(map, colorsRef.current);
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

  return <div style={{ display: "grid", placeItems: "center", gap: 12 }}>
    {state === "loading" ? <span style={{ color: "#64748b", fontSize: 14 }}>Carregando mapa de cobertura...</span> : null}
    {state === "unavailable" ? <div style={{ display: "grid", minHeight: 220, width: "100%", placeItems: "center", border: "1px solid #bfdbfe", borderRadius: 20, background: "#eff6ff", color: "#2563eb", fontWeight: 700, textAlign: "center" }}>Cobertura nacional</div> : null}
    <div ref={containerRef} style={{ display: state === "ready" ? "block" : "none", width: "min(100%, 460px)" }} />
  </div>;
}

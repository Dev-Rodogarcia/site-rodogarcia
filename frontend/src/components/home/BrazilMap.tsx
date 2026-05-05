"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CursorClick,
  EnvelopeSimple,
  MapPin,
  Phone,
} from "@phosphor-icons/react";
import {
  MAPEAMENTO_INDICE_PARA_ESTADO,
  CORES,
  getIndicePorEstado,
  SVG_PATH,
} from "@/data/brazilMap";
import { site } from "@/lib/routes";
import type { HomeRegionalUnit } from "@/types/content";

interface BrazilMapProps {
  units: HomeRegionalUnit[];
}

function normalizeState(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function normalizeUnits(units: HomeRegionalUnit[]) {
  return [...units]
    .filter((unit) => unit.active !== false)
    .map((unit) => ({ ...unit, state: normalizeState(unit.state) }))
    .filter((unit) => unit.id && unit.name && unit.state && unit.address)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export default function BrazilMap({ units }: BrazilMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const selectedEstadoRef = useRef("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const activeUnits = useMemo(() => normalizeUnits(units), [units]);
  const defaultUnit = useMemo(
    () => activeUnits[0] ?? null,
    [activeUnits]
  );
  const selectedUnit = useMemo(
    () =>
      activeUnits.find((unit) => unit.id === selectedUnitId) ??
      defaultUnit,
    [activeUnits, defaultUnit, selectedUnitId]
  );
  const statesWithUnits = useMemo(
    () => new Set(activeUnits.map((unit) => unit.state)),
    [activeUnits]
  );
  const selectedEstado = selectedUnit?.state ?? "";

  useEffect(() => {
    if (!defaultUnit) return;
    if (activeUnits.some((unit) => unit.id === selectedUnitId)) return;
    setSelectedUnitId(defaultUnit.id);
  }, [activeUnits, defaultUnit, selectedUnitId]);

  const getUnitsByState = useCallback(
    (estadoId: string) =>
      activeUnits.filter((unit) => unit.state === estadoId.toLowerCase()),
    [activeUnits]
  );

  const applyFill = useCallback(
    (svg: SVGSVGElement, estadoId: string, fill: string, strokeWidth: string) => {
      const indice = getIndicePorEstado(estadoId);
      if (indice === null) return;

      const paths = Array.from(svg.querySelectorAll<SVGPathElement>("path[id]"));
      const path = paths[indice];
      if (!path) return;

      path.style.setProperty("fill", fill, "important");
      path.style.setProperty("stroke", CORES.stroke, "important");
      path.style.setProperty("stroke-width", strokeWidth, "important");
    },
    []
  );

  const resetAllPaths = useCallback(
    (svg: SVGSVGElement) => {
      const paths = Array.from(svg.querySelectorAll<SVGPathElement>("path[id]"));

      paths.forEach((path, index) => {
        const estado = MAPEAMENTO_INDICE_PARA_ESTADO[index];
        const hasUnit = Boolean(estado && statesWithUnits.has(estado));

        path.style.setProperty("fill", hasUnit ? CORES.destaque : CORES.base, "important");
        path.style.setProperty("stroke", CORES.stroke, "important");
        path.style.setProperty(
          "stroke-width",
          hasUnit ? CORES.strokeWidthDestacado : CORES.strokeWidthNormal,
          "important"
        );
        path.style.cursor = hasUnit ? "pointer" : "default";
        path.style.setProperty("opacity", "1", "important");
      });
    },
    [statesWithUnits]
  );

  const getStateDataFromTarget = useCallback(
    (svg: SVGSVGElement, target: EventTarget | null) => {
      if (!(target instanceof Element)) return null;

      const path = target.closest<SVGPathElement>("path[id]");
      if (!path) return null;

      const paths = Array.from(svg.querySelectorAll<SVGPathElement>("path[id]"));
      const index = paths.indexOf(path);
      const estadoId = MAPEAMENTO_INDICE_PARA_ESTADO[index];
      if (!estadoId) return null;

      return { estadoId, path, hasUnit: statesWithUnits.has(estadoId) };
    },
    [statesWithUnits]
  );

  const selectEstado = useCallback(
    (svg: SVGSVGElement, estadoId: string, selected?: HomeRegionalUnit) => {
      const stateUnits = getUnitsByState(estadoId);
      const nextUnit = selected ?? stateUnits[0];
      if (!nextUnit) return;

      resetAllPaths(svg);
      applyFill(svg, estadoId, CORES.hover, CORES.strokeWidthDestacado);
      selectedEstadoRef.current = estadoId;
      setSelectedUnitId(nextUnit.id);
    },
    [applyFill, getUnitsByState, resetAllPaths]
  );

  useEffect(() => {
    selectedEstadoRef.current = selectedEstado;
  }, [selectedEstado]);

  useEffect(() => {
    let cancelled = false;
    let svg: SVGSVGElement | null = null;
    let wrapper: HTMLDivElement | null = null;

    const handleClick = (event: MouseEvent) => {
      if (!svg) return;
      const stateData = getStateDataFromTarget(svg, event.target);
      if (!stateData || !stateData.hasUnit) return;

      selectEstado(svg, stateData.estadoId);
    };

    const handleMouseOver = (event: MouseEvent) => {
      if (!svg) return;
      const stateData = getStateDataFromTarget(svg, event.target);
      if (!stateData || !stateData.hasUnit) return;
      if (stateData.estadoId === selectedEstadoRef.current) return;

      stateData.path.style.setProperty("fill", CORES.hover, "important");
      stateData.path.style.setProperty("opacity", "0.9", "important");
    };

    const handleMouseOut = (event: MouseEvent) => {
      if (!svg) return;
      const stateData = getStateDataFromTarget(svg, event.target);
      if (!stateData || !stateData.hasUnit) return;
      if (stateData.estadoId === selectedEstadoRef.current) return;

      stateData.path.style.setProperty("fill", CORES.destaque, "important");
      stateData.path.style.setProperty("opacity", "1", "important");
    };

    fetch(SVG_PATH)
      .then((response) => response.text())
      .then((svgText) => {
        if (cancelled || !containerRef.current || !defaultUnit) return;

        wrapper = containerRef.current.querySelector<HTMLDivElement>(".svg-wrapper");
        if (!wrapper) return;

        wrapper.innerHTML = svgText;
        svg = wrapper.querySelector<SVGSVGElement>("svg");
        if (!svg) return;

        svgRef.current = svg;
        svg.removeAttribute("width");
        svg.removeAttribute("height");
        svg.style.width = "100%";
        svg.style.height = "auto";

        resetAllPaths(svg);
        selectEstado(svg, defaultUnit.state, defaultUnit);

        svg.addEventListener("click", handleClick);
        svg.addEventListener("mouseover", handleMouseOver);
        svg.addEventListener("mouseout", handleMouseOut);

        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;

      if (svg) {
        svg.removeEventListener("click", handleClick);
        svg.removeEventListener("mouseover", handleMouseOver);
        svg.removeEventListener("mouseout", handleMouseOut);
      }

      if (wrapper) {
        wrapper.innerHTML = "";
      }

      if (svgRef.current === svg) {
        svgRef.current = null;
      }
    };
  }, [defaultUnit, getStateDataFromTarget, resetAllPaths, selectEstado]);

  useEffect(() => {
    if (!svgRef.current || !selectedEstado) return;

    resetAllPaths(svgRef.current);
    applyFill(svgRef.current, selectedEstado, CORES.hover, CORES.strokeWidthDestacado);
  }, [applyFill, resetAllPaths, selectedEstado]);

  if (!selectedUnit) return null;

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const unit = activeUnits.find((item) => item.id === event.target.value);
    if (!unit) return;

    if (svgRef.current) {
      selectEstado(svgRef.current, unit.state, unit);
      return;
    }

    selectedEstadoRef.current = unit.state;
    setSelectedUnitId(unit.id);
  };

  const contactHref = selectedUnit.contactUrl || site.contact;
  const unitDescription = selectedUnit.description || "";

  return (
    <div className="w-full" ref={containerRef}>
      <div className="mx-auto max-w-[48rem] text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/[0.55]">
          Presenca regional
        </span>
        <h2 className="mt-4 text-[clamp(1.9rem,3.4vw,3.1rem)] font-bold leading-[1.02] tracking-[-0.04em] text-white">
          Filiais e pontos de apoio para acelerar decisoes operacionais.
        </h2>
        <p className="mt-4 text-base leading-7 text-white/[0.68]">
          Consulte rapidamente a unidade mais próxima da sua operação e alterne a
          visualizacao com o seletor ou pelo mapa.
        </p>
      </div>

      <div className="mt-10 grid w-full grid-cols-1 items-stretch gap-8 xl:grid-cols-[minmax(340px,400px)_minmax(440px,520px)] xl:justify-center xl:gap-8 2xl:gap-10">
        <aside className="min-w-0">
          <div className="h-full rounded-[30px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,248,252,0.98)_100%)] p-6 shadow-[0_22px_48px_rgba(15,23,42,0.16)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted-raw)]">
                  Unidade ativa
                </p>
                <h3 className="mt-3 text-[1.4rem] font-semibold tracking-[-0.03em] text-[var(--foreground)]">
                  {selectedUnit.name}
                </h3>
                {unitDescription ? (
                  <p className="mt-2 text-sm leading-6 text-[var(--color-muted-raw)]">
                    {unitDescription}
                  </p>
                ) : null}
              </div>
              <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--color-surface-2)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                {selectedUnit.state.toUpperCase()}
              </span>
            </div>

            <div className="mt-6 border-t border-[var(--border)]/70 pt-6">
              <label
                htmlFor="selectFilial"
                className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]"
              >
                Selecionar unidade
              </label>
              <select
                id="selectFilial"
                value={selectedUnit.id}
                onChange={handleSelectChange}
                className="mt-3 w-full rounded-[18px] border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] shadow-[var(--shadow-xs)] outline-none transition focus-visible:ring-2 ring-[var(--primary)]"
              >
                {activeUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>

              <div className="mt-3 flex items-start gap-2 text-xs leading-5 text-[var(--color-muted-raw)]">
                <CursorClick
                  size={14}
                  weight="fill"
                  className="mt-0.5 flex-shrink-0 text-[var(--primary)]"
                />
                <span>Estados destacados respondem ao clique no mapa.</span>
              </div>
            </div>

            <ul className="mt-6 space-y-4 text-sm text-[var(--color-muted-raw)]">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--primary)]">
                  <MapPin size={16} weight="fill" />
                </span>
                <span className="leading-6">{selectedUnit.address}</span>
              </li>
              {selectedUnit.phone ? (
                <li className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--primary)]">
                    <Phone size={16} weight="fill" />
                  </span>
                  <span>{selectedUnit.phone}</span>
                </li>
              ) : null}
              {selectedUnit.email ? (
                <li className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--primary)]">
                    <EnvelopeSimple size={16} weight="fill" />
                  </span>
                  <span className="break-all leading-6">{selectedUnit.email}</span>
                </li>
              ) : null}
            </ul>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mx-auto flex h-full w-full max-w-[560px] items-center justify-center overflow-hidden rounded-[30px] border border-white/[0.14] bg-transparent px-4 py-5 sm:px-6 lg:px-7 lg:py-6">
            {isLoading && (
              <div className="flex min-h-[300px] w-full items-center justify-center text-sm text-slate-500 lg:min-h-[360px]">
                Carregando mapa do Brasil...
              </div>
            )}
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ display: isLoading ? "none" : "flex" }}
            >
              <div className="svg-wrapper mx-auto w-full max-w-[640px] [&_svg]:mx-auto [&_svg]:w-full [&_svg]:origin-center [&_svg]:scale-[0.94] lg:[&_svg]:scale-[0.98]" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          href={contactHref}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-strong)]"
        >
          {selectedUnit.buttonLabel || "Falar com esta unidade"}
          <ArrowRight size={14} weight="bold" />
        </Link>
      </div>
    </div>
  );
}

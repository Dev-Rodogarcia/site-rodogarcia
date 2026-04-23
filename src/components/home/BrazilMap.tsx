"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  ESTADOS_COM_FILIAIS,
  CORES,
  FILIAIS,
  Filial,
  getFiliaisPorEstado,
  getIndicePorEstado,
  SVG_PATH,
} from "@/data/brazilMap";
import { site } from "@/lib/routes";

const DEFAULT_FILIAL = FILIAIS.find((f) => f.id === "matriz")!;

export default function BrazilMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const selectedEstadoRef = useRef<string>(DEFAULT_FILIAL.estado);
  const [selectedFilial, setSelectedFilial] = useState<Filial>(DEFAULT_FILIAL);
  const [selectedEstado, setSelectedEstado] = useState<string>(DEFAULT_FILIAL.estado);
  const [isLoading, setIsLoading] = useState(true);

  const applyFill = useCallback(
    (svg: SVGSVGElement, estadoId: string, fill: string, strokeWidth: string) => {
      const índice = getIndicePorEstado(estadoId);
      if (índice === null) return;

      const paths = Array.from(svg.querySelectorAll<SVGPathElement>("path[id]"));
      const path = paths[índice];
      if (!path) return;

      path.style.setProperty("fill", fill, "important");
      path.style.setProperty("stroke", CORES.stroke, "important");
      path.style.setProperty("stroke-width", strokeWidth, "important");
    },
    []
  );

  const resetAllPaths = useCallback((svg: SVGSVGElement) => {
    const paths = Array.from(svg.querySelectorAll<SVGPathElement>("path[id]"));

    paths.forEach((path, index) => {
      const estado = MAPEAMENTO_INDICE_PARA_ESTADO[index];
      const temFilial =
        estado &&
        ESTADOS_COM_FILIAIS.includes(estado as (typeof ESTADOS_COM_FILIAIS)[number]);

      path.style.setProperty("fill", temFilial ? CORES.destaque : CORES.base, "important");
      path.style.setProperty("stroke", CORES.stroke, "important");
      path.style.setProperty(
        "stroke-width",
        temFilial ? CORES.strokeWidthDestacado : CORES.strokeWidthNormal,
        "important"
      );
      path.style.cursor = temFilial ? "pointer" : "default";
      path.style.setProperty("opacity", "1", "important");
    });
  }, []);

  const getStateDataFromTarget = useCallback((svg: SVGSVGElement, target: EventTarget | null) => {
    if (!(target instanceof Element)) return null;

    const path = target.closest<SVGPathElement>("path[id]");
    if (!path) return null;

    const paths = Array.from(svg.querySelectorAll<SVGPathElement>("path[id]"));
    const index = paths.indexOf(path);
    const estadoId = MAPEAMENTO_INDICE_PARA_ESTADO[index];
    if (!estadoId) return null;

    const temFilial = ESTADOS_COM_FILIAIS.includes(
      estadoId as (typeof ESTADOS_COM_FILIAIS)[number]
    );

    return { estadoId, path, temFilial };
  }, []);

  const selectEstado = useCallback(
    (svg: SVGSVGElement, estadoId: string, filialSelecionada?: Filial) => {
      resetAllPaths(svg);
      applyFill(svg, estadoId, CORES.hover, CORES.strokeWidthDestacado);
      selectedEstadoRef.current = estadoId;
      setSelectedEstado(estadoId);

      if (filialSelecionada) {
        setSelectedFilial(filialSelecionada);
        return;
      }

      const filiaisEstado = getFiliaisPorEstado(estadoId);
      if (filiaisEstado.length > 0) {
        setSelectedFilial(filiaisEstado[0]);
      }
    },
    [applyFill, resetAllPaths]
  );

  useEffect(() => {
    selectedEstadoRef.current = selectedEstado;
  }, [selectedEstado]);

  useEffect(() => {
    let cancelled = false;
    let svg: SVGSVGElement | null = null;
    let wrapper: HTMLDivElement | null = null;

    const handleClick = (e: MouseEvent) => {
      if (!svg) return;
      const stateData = getStateDataFromTarget(svg, e.target);
      if (!stateData || !stateData.temFilial) return;

      selectEstado(svg, stateData.estadoId);
    };

    const handleMouseOver = (e: MouseEvent) => {
      if (!svg) return;
      const stateData = getStateDataFromTarget(svg, e.target);
      if (!stateData || !stateData.temFilial) return;
      if (stateData.estadoId === selectedEstadoRef.current) return;

      stateData.path.style.setProperty("fill", CORES.hover, "important");
      stateData.path.style.setProperty("opacity", "0.9", "important");
    };

    const handleMouseOut = (e: MouseEvent) => {
      if (!svg) return;
      const stateData = getStateDataFromTarget(svg, e.target);
      if (!stateData || !stateData.temFilial) return;
      if (stateData.estadoId === selectedEstadoRef.current) return;

      stateData.path.style.setProperty("fill", CORES.destaque, "important");
      stateData.path.style.setProperty("opacity", "1", "important");
    };

    fetch(SVG_PATH)
      .then((response) => response.text())
      .then((svgText) => {
        if (cancelled || !containerRef.current) return;

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
        selectEstado(svg, DEFAULT_FILIAL.estado, DEFAULT_FILIAL);

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
  }, [getStateDataFromTarget, resetAllPaths, selectEstado]);

  useEffect(() => {
    if (!svgRef.current) return;

    resetAllPaths(svgRef.current);
    applyFill(svgRef.current, selectedEstado, CORES.hover, CORES.strokeWidthDestacado);
  }, [applyFill, resetAllPaths, selectedEstado]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const filialId = e.target.value;
    const filial = FILIAIS.find((f) => f.id === filialId);
    if (!filial) return;

    if (svgRef.current) {
      selectEstado(svgRef.current, filial.estado, filial);
      return;
    }

    selectedEstadoRef.current = filial.estado;
    setSelectedEstado(filial.estado);
    setSelectedFilial(filial);
  };

  const dropdownOptions = FILIAIS.map((f) => ({ value: f.id, label: f.nome }));

  return (
    <div className="w-full" ref={containerRef}>
      <div className="mx-auto max-w-[48rem] text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/[0.55]">
          Presença regional
        </span>
        <h2 className="mt-4 text-[clamp(1.9rem,3.4vw,3.1rem)] font-bold leading-[1.02] tracking-[-0.04em] text-white">
          Filiais e pontos de apoio para acelerar decisões operacionais.
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
                  {selectedFilial.nome}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted-raw)]">
                  Use o seletor ou clique no estado correspondente no mapa.
                </p>
              </div>
              <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--color-surface-2)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                {selectedFilial.estado.toUpperCase()}
              </span>
            </div>

            <div className="mt-6 border-t border-[var(--border)]/70 pt-6">
              <label
                htmlFor="selectFilial"
                className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]"
              >
                Selecionar filial
              </label>
              <select
                id="selectFilial"
                value={selectedFilial.id}
                onChange={handleSelectChange}
                className="mt-3 w-full rounded-[18px] border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] shadow-[var(--shadow-xs)] outline-none transition focus-visible:ring-2 ring-[var(--primary)]"
              >
                {dropdownOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
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
                <span className="leading-6">{selectedFilial.endereco}</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--primary)]">
                  <Phone size={16} weight="fill" />
                </span>
                <span>{selectedFilial.telefone}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--primary)]">
                  <EnvelopeSimple size={16} weight="fill" />
                </span>
                <span className="break-all leading-6">{selectedFilial.email}</span>
              </li>
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
          href={site.contact}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-strong)]"
        >
          Falar com esta unidade
          <ArrowRight size={14} weight="bold" />
        </Link>
      </div>
    </div>
  );
}

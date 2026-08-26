"use client";

import { useMemo, useState } from "react";
import { CaretDown, EnvelopeSimple, MapPinLine } from "@phosphor-icons/react";
import type { OperationalUnit } from "@/types/content";

type CareersApplicationSelectorProps = {
  units: OperationalUnit[];
};

export function CareersApplicationSelector({ units }: CareersApplicationSelectorProps) {
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const branchUnits = useMemo(
    () => units.filter((unit) => unit.active !== false && unit.type?.trim().toLowerCase() === "filial" && unit.email?.includes("@")),
    [units]
  );
  const selectedUnit = branchUnits.find((unit) => unit.id === selectedUnitId);

  function sendCurriculum() {
    if (!selectedUnit?.email) return;

    const subject = `Currículo - ${selectedUnit.name}`;
    window.location.assign(`mailto:${selectedUnit.email}?subject=${encodeURIComponent(subject)}`);
  }

  if (branchUnits.length === 0) return null;

  return (
    <div className="w-full">
      <label htmlFor="career-branch" className="mb-2 block text-sm font-semibold text-white">
        Escolha a filial para enviar seu currículo
      </label>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="relative">
          <MapPinLine size={18} weight="bold" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sky-300" />
          <select
            id="career-branch"
            value={selectedUnitId}
            onChange={(event) => setSelectedUnitId(event.target.value)}
            className="min-h-[60px] w-full appearance-none rounded-2xl border border-slate-600 bg-slate-900 px-11 pr-10 text-[15px] font-semibold text-white outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-400/20"
          >
            <option value="" disabled>Selecione uma filial</option>
            {branchUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
          </select>
          <CaretDown size={18} weight="bold" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sky-300" />
        </div>
        <button
          type="button"
          disabled={!selectedUnit}
          onClick={sendCurriculum}
          className="inline-flex min-h-[60px] items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 text-[15px] font-semibold text-white shadow-[0_12px_32px_rgba(14,165,233,0.25)] transition hover:-translate-y-0.5 hover:bg-sky-400 hover:shadow-[0_20px_48px_rgba(14,165,233,0.35)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-500/30 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none sm:min-w-[13rem]"
        >
          <EnvelopeSimple size={19} weight="bold" />
          Enviar currículo
        </button>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400">Seu aplicativo de e-mail abrirá com a filial escolhida como destinatária.</p>
    </div>
  );
}

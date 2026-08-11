"use client";

import { useEffect, useRef, useState } from "react";
import { Lightbulb, UsersThree } from "@phosphor-icons/react";
import ImprovementForm, { type Profile } from "@/components/forms/ImprovementForm";
import { SurfaceSection } from "@/components/internal/PageContent";
import { cn } from "@/lib/utils";

export function ImprovementExperience() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [asideVisible, setAsideVisible] = useState(true);
  const [asideLeaving, setAsideLeaving] = useState(false);
  const asideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formSelected = profile !== null;

  useEffect(() => () => {
    if (asideTimer.current) clearTimeout(asideTimer.current);
  }, []);

  function handleProfileChange(nextProfile: Profile | null) {
    if (asideTimer.current) clearTimeout(asideTimer.current);

    const desktop = window.matchMedia("(min-width: 1024px)").matches;
    if (nextProfile && desktop) {
      setProfile(nextProfile);
      setAsideLeaving(true);
      asideTimer.current = setTimeout(() => {
        setAsideVisible(false);
        setAsideLeaving(false);
      }, 360);
      return;
    }

    if (nextProfile) {
      setProfile(nextProfile);
      return;
    }

    setAsideVisible(true);
    setAsideLeaving(false);
    setProfile(null);
  }

  return (
    <SurfaceSection
      tone="default"
      contentClassName={cn(
        "relative grid gap-8 lg:items-start lg:transition-[grid-template-columns] lg:duration-500 lg:ease-out",
        formSelected
          ? "lg:grid-cols-1"
          : "lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]"
      )}
    >
      {asideVisible ? (
        <aside
          className={cn(
            "rounded-[30px] border border-emerald-300/20 bg-[linear-gradient(145deg,#0f766e,#12324a)] p-7 text-white shadow-[0_22px_52px_rgba(2,6,23,0.22)] lg:h-[348px]",
            asideLeaving
              ? "animate-out fade-out-0 slide-out-to-left-8 duration-300 lg:absolute lg:inset-y-0 lg:left-0 lg:z-10 lg:w-[38.7%]"
              : "animate-in fade-in-0 slide-in-from-left-8 duration-400"
          )}
        >
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12"><Lightbulb size={26} weight="fill" /></span>
          <h2 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">Uma ideia pode simplificar o próximo passo.</h2>
          <p className="mt-3 text-sm leading-7 text-white/78">Relate o contexto. A equipe recebe somente os dados necessários para entender e avaliar a melhoria.</p>
          <div className="mt-7 border-t border-white/15 pt-5"><div className="flex gap-3"><UsersThree size={20} className="mt-0.5 shrink-0 text-emerald-200" /><p className="text-sm leading-6 text-white/82">Colaboradores informam a filial para que a sugestão chegue com o contexto operacional adequado.</p></div></div>
        </aside>
      ) : null}
      <div className="min-w-0">
        <ImprovementForm onProfileChange={handleProfileChange} />
      </div>
    </SurfaceSection>
  );
}

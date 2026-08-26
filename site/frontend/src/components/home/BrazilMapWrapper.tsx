"use client";

import dynamic from "next/dynamic";
import type { HomeRegionalUnit } from "@/types/content";

const BrazilMap = dynamic<{ units: HomeRegionalUnit[] }>(() => import("./BrazilMap"), {
  ssr: false,
});

export default function BrazilMapWrapper({ units }: { units: HomeRegionalUnit[] }) {
  return <BrazilMap units={units} />;
}

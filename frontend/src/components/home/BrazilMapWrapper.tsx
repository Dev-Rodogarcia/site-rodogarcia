"use client";

import dynamic from "next/dynamic";
import type { OperationalUnit } from "@/types/content";

const BrazilMap = dynamic<{ units: OperationalUnit[] }>(() => import("./BrazilMap"), {
  ssr: false,
});

export default function BrazilMapWrapper({ units }: { units: OperationalUnit[] }) {
  return <BrazilMap units={units} />;
}

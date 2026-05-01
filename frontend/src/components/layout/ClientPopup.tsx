"use client";

import dynamic from "next/dynamic";

const ExitPopup = dynamic(
  () => import("@/components/exit-popup/ExitPopup"),
  { ssr: false }
);

export default function ClientPopup() {
  return <ExitPopup />;
}

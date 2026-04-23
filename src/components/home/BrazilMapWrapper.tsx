"use client";

import dynamic from "next/dynamic";

const BrazilMap = dynamic(() => import("./BrazilMap"), { ssr: false });

export default function BrazilMapWrapper() {
  return <BrazilMap />;
}

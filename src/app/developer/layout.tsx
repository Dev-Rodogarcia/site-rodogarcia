import type { Metadata } from "next";
import DeveloperShell from "@/components/developer/DeveloperShell";

export const metadata: Metadata = {
  title: {
    default: "Painel | Rodogarcia",
    template: "%s | Painel Rodogarcia",
  },
  robots: { index: false, follow: false },
};

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DeveloperShell>{children}</DeveloperShell>;
}

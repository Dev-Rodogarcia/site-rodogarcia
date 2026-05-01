import type { Metadata } from "next";
import DeveloperAuthGate from "@/components/developer/DeveloperAuthGate";
import DeveloperShell from "@/components/developer/DeveloperShell";
import { SessionProvider } from "@/components/layout/SessionProvider";

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
  return (
    <SessionProvider>
      <DeveloperAuthGate>
        <DeveloperShell>{children}</DeveloperShell>
      </DeveloperAuthGate>
    </SessionProvider>
  );
}

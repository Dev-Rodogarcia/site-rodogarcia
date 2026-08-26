import type { Metadata } from "next";
import "./globals.css";
import { builderSiteUrl } from "@/lib/landing";

export const metadata: Metadata = {
  metadataBase: builderSiteUrl(),
  title: { default: "Rodogarcia", template: "%s | Rodogarcia" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}

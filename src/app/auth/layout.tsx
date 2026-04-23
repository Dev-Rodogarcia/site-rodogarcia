import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Auth pages have no site header or footer */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { auth } from "@/lib/routes";

export default function DeveloperAuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading } = useSession();

  useEffect(() => {
    if (loading) return;
    if (!session?.authenticated || session.user?.role !== "admin") {
      router.replace(
        `${auth.login}?area=staff&next=${encodeURIComponent(pathname || "/developer")}`
      );
    }
  }, [loading, pathname, router, session?.authenticated, session?.user?.role]);

  if (loading || !session?.authenticated || session.user?.role !== "admin") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--background)] px-6 text-sm font-semibold text-[var(--color-muted-raw)]">
        Carregando acesso interno...
      </div>
    );
  }

  return <>{children}</>;
}

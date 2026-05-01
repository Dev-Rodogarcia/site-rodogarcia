import { NextRequest, NextResponse } from "next/server";
import { auth, isAdminRoute } from "@/lib/routes";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isAdminRoute(pathname)) {
    const session = request.cookies.get("sid");
    if (!session?.value) {
      const loginUrl = new URL(auth.login, request.url);
      loginUrl.searchParams.set("area", "staff");
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/developer", "/developer/:path*", "/auth/entrar"],
};

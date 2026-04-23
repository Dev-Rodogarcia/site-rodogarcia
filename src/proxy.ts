import { NextRequest, NextResponse } from "next/server";
import { admin, auth, isAdminRoute, isAuthRoute } from "@/lib/routes";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isAdminRoute(pathname)) {
    const sid = request.cookies.get("sid");
    if (!sid?.value) {
      const loginUrl = new URL(auth.login, request.url);
      loginUrl.searchParams.set("area", "staff");
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isAuthRoute(pathname)) {
    const sid = request.cookies.get("sid");
    if (sid?.value) {
      return NextResponse.redirect(new URL(admin.root, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/developer", "/developer/:path*", "/auth/entrar", "/auth/criar-conta"],
};

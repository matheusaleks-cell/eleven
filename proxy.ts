import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isAdminLogin = pathname === "/admin/login";
  const isAdminRoute = pathname.startsWith("/admin") && !isAdminLogin;
  const isInvestorRoute = pathname.startsWith("/investidor");

  if (isAdminRoute) {
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/admin/login", req.nextUrl));
    }
  }

  if (isInvestorRoute) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }
  }

  // Repassa o pathname para os Server Components (ex.: layouts) via header,
  // já que eles não têm acesso direto à URL da requisição atual.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: ["/admin/:path*", "/investidor/:path*"],
};

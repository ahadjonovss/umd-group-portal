import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

// Optimistik tekshiruv — faqat cookie borligini ko'radi (admin verify bu yerda emas,
// tezlik uchun). Haqiqiy tasdiqlash sahifa/route ichida DAL orqali bo'ladi.
const PROTECTED_PREFIXES = ["/submit", "/panel", "/review"];
const AUTH_PAGES = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isAuthPage = AUTH_PAGES.includes(pathname);

  // Himoyalangan sahifa + sessiya yo'q → login'ga (qaytish manzili bilan).
  if (isProtected && !hasSession) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Login/register sahifasi + sessiya bor → kabinetga.
  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL("/panel", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/submit/:path*", "/panel/:path*", "/review/:path*", "/login", "/register"],
};

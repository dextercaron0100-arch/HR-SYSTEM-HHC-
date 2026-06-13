import { NextRequest, NextResponse } from "next/server";

const authCookieName = "hr_session";

const protectedPrefixes = [
  "/dashboard",
  "/employees",
  "/attendance",
  "/performance",
  "/leave",
  "/payroll",
  "/recruitment",
  "/onboarding",
  "/documents",
  "/reports",
  "/settings"
];

const publicFilePattern = /\.(.*)$/;

const isProtectedPath = (pathname: string) =>
  protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    publicFilePattern.test(pathname)
  ) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get(authCookieName)?.value;
  const isAuthenticated = Boolean(sessionToken);

  if (pathname === "/login") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (isProtectedPath(pathname) && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"]
};

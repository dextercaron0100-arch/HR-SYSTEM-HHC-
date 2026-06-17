import { NextRequest, NextResponse } from "next/server";

const authCookieName = "hr_session";
const roleCookieName = "hr_role";

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

// Routes each role is NOT allowed to access
const roleRestrictions: Record<string, string[]> = {
  hr_admin:    ["/payroll"],
  finance:     ["/recruitment", "/onboarding", "/attendance", "/performance", "/leave", "/settings"],
  manager:     ["/payroll", "/recruitment", "/onboarding", "/documents", "/settings"],
  employee:    ["/payroll", "/recruitment", "/onboarding", "/documents", "/settings", "/employees", "/reports"]
};

const publicFilePattern = /\.(.*)$/;

const isProtectedPath = (pathname: string) =>
  protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

const isBlockedForRole = (pathname: string, role: string): boolean => {
  const denied = roleRestrictions[role];
  if (!denied) return false;
  return denied.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
};

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

  if (isAuthenticated && isProtectedPath(pathname)) {
    const role = decodeURIComponent(request.cookies.get(roleCookieName)?.value ?? "");
    if (role && isBlockedForRole(pathname, role)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"]
};

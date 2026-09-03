import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
import { roleHome } from "@/lib/roles";
import type { Role } from "@prisma/client";

/**
 * Page-level RBAC. Every API handler additionally verifies the JWT + role
 * itself via requireAuth() — this layer shapes where each role can browse.
 *
 * Access matrix:
 *   ADMIN         → /admin (plus oversight of /reception, /housekeeping)
 *   RECEPTIONIST  → /reception
 *   HOUSEKEEPING  → /housekeeping
 *   GUEST         → public site, booking flow, /dashboard
 *   all signed-in → /dashboard/profile (account settings)
 *
 * Staff have no business on customer-facing pages (browsing, booking,
 * paying) — those requests bounce to their own dashboard.
 */
const STAFF_SECTIONS: { prefix: string; roles: Role[] }[] = [
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/reception", roles: ["ADMIN", "RECEPTIONIST"] },
  { prefix: "/housekeeping", roles: ["ADMIN", "HOUSEKEEPING"] },
];

/** Customer-facing areas that staff accounts are redirected away from. */
const CUSTOMER_PREFIXES = ["/rooms", "/book", "/bookings", "/payment"];

function matches(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  const loginRedirect = () => {
    const login = new URL("/login", req.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  };
  const homeRedirect = (role: Role) =>
    NextResponse.redirect(new URL(roleHome(role), req.url));

  // Staff sections
  const section = STAFF_SECTIONS.find((r) => matches(pathname, r.prefix));
  if (section) {
    if (!session) return loginRedirect();
    if (!section.roles.includes(session.role)) return homeRedirect(session.role);
    return NextResponse.next();
  }

  // Guest dashboard — profile is open to every signed-in role
  if (matches(pathname, "/dashboard")) {
    if (!session) return loginRedirect();
    const isProfile = matches(pathname, "/dashboard/profile");
    if (!isProfile && session.role !== "GUEST") return homeRedirect(session.role);
    return NextResponse.next();
  }

  // Customer-facing pages — staff are sent back to their own dashboard
  const isCustomerArea =
    pathname === "/" || CUSTOMER_PREFIXES.some((p) => matches(pathname, p));
  if (isCustomerArea && session && session.role !== "GUEST") {
    return homeRedirect(session.role);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/rooms/:path*",
    "/book/:path*",
    "/bookings/:path*",
    "/payment/:path*",
    "/admin/:path*",
    "/reception/:path*",
    "/housekeeping/:path*",
    "/dashboard/:path*",
  ],
};

import { getSession } from "@/lib/session";
import { roleHome } from "@/lib/roles";
import { SiteHeader, type HeaderUser, type NavItem } from "@/components/SiteHeader";

/**
 * Server half of the header: decides what this visitor may see, then hands
 * plain data to the client shell (scroll state, menus). Staff never see
 * customer-facing links; guests never see staff links.
 */
const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  RECEPTIONIST: "Reception",
  HOUSEKEEPING: "Housekeeping",
  GUEST: "Guest",
};

function navFor(role: string | null): NavItem[] {
  switch (role) {
    case "ADMIN":
      // Admin oversees every desk, so each section is one tap away.
      return [
        { href: "/admin", label: "Admin" },
        { href: "/reception", label: "Reception" },
        { href: "/housekeeping", label: "Housekeeping" },
      ];
    case "RECEPTIONIST":
      return [{ href: "/reception", label: "Front desk" }];
    case "HOUSEKEEPING":
      return [{ href: "/housekeeping", label: "Housekeeping" }];
    case "GUEST":
      return [
        { href: "/rooms", label: "Rooms" },
        { href: "/dashboard", label: "My bookings" },
      ];
    default:
      return [{ href: "/rooms", label: "Rooms" }];
  }
}

export async function Navbar() {
  const session = await getSession();

  const user: HeaderUser | null = session
    ? {
        name: session.name,
        email: session.email,
        roleLabel: ROLE_LABELS[session.role] ?? session.role,
        home: roleHome(session.role),
        homeLabel: navFor(session.role)[0]!.label,
        staff: session.role !== "GUEST",
      }
    : null;

  return (
    <SiteHeader
      items={navFor(session?.role ?? null)}
      user={user}
      logoHref={user?.staff ? user.home : "/"}
    />
  );
}

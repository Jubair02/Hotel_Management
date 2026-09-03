import Link from "next/link";
import { getSession } from "@/lib/session";
import { roleHome } from "@/lib/roles";
import { LogoutButton } from "@/components/LogoutButton";
import { NavLinks, type NavItem } from "@/components/NavLinks";

const ROLE_LINKS: Record<string, NavItem> = {
  ADMIN: { href: "/admin", label: "Admin" },
  RECEPTIONIST: { href: "/reception", label: "Reception" },
  HOUSEKEEPING: { href: "/housekeeping", label: "Housekeeping" },
  GUEST: { href: "/dashboard", label: "My bookings" },
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  RECEPTIONIST: "Reception",
  HOUSEKEEPING: "Housekeeping",
  GUEST: "Guest",
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export async function Navbar() {
  const session = await getSession();
  const staff = session ? session.role !== "GUEST" : false;

  // Staff never see customer-facing links; guests never see staff links.
  const items: NavItem[] = staff
    ? [ROLE_LINKS[session!.role]].filter(Boolean)
    : [
        { href: "/rooms", label: "Rooms" },
        ...(session ? [ROLE_LINKS.GUEST] : []),
      ];

  // For staff the logo is a way back to their own dashboard, not the
  // public site.
  const logoHref = staff ? roleHome(session!.role) : "/";

  return (
    <header className="sticky top-0 z-40 bg-sand-50/85 backdrop-blur">
      {/* Brass rail — the key-tag metal, run along the top of the house */}
      <div
        aria-hidden
        className="h-0.5 bg-gradient-to-r from-marigold-600 via-marigold-400 to-marigold-600"
      />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 border-b border-sand-200 px-6">
        {/* Lockup: brass plaque monogram + stacked wordmark */}
        <Link href={logoHref} className="group flex items-center gap-3">
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-marigold-600/40 bg-gradient-to-b from-marigold-400 to-marigold-500 font-display text-sm font-semibold text-pine-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(0,0,0,0.08)] transition-transform duration-200 group-hover:-rotate-3"
          >
            GT
          </span>
          <span className="hidden leading-none sm:block">
            <span className="block font-display text-xl text-pine-900">
              Grand Tulip
            </span>
            <span className="mt-1 block text-[10px] uppercase tracking-[0.28em] text-ink-400">
              Gulshan · Dhaka
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Main">
          <NavLinks items={items} />

          {session ? (
            <div className="ml-2 flex items-center gap-2 border-l border-sand-200 pl-3">
              <Link
                href="/dashboard/profile"
                title="Profile settings"
                className="flex items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-sand-100"
              >
                <span
                  aria-hidden
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-pine-800 font-display text-xs text-white"
                >
                  {initials(session.name)}
                </span>
                <span className="hidden leading-tight md:block">
                  <span className="block max-w-32 truncate text-sm font-medium text-ink-900">
                    {session.name}
                  </span>
                  <span className="block text-[10px] uppercase tracking-[0.15em] text-ink-400">
                    {ROLE_LABELS[session.role] ?? session.role}
                  </span>
                </span>
              </Link>
              <LogoutButton />
            </div>
          ) : (
            <div className="ml-2 flex items-center gap-2 border-l border-sand-200 pl-3">
              <Link
                href="/login"
                className="px-3 py-2 text-sm text-ink-600 transition-colors hover:text-pine-900"
              >
                Sign in
              </Link>
              <Link
                href="/rooms"
                className="rounded-md bg-pine-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-pine-700 active:translate-y-px"
              >
                Book a stay
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

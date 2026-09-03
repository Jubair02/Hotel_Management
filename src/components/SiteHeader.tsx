"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

export type NavItem = { href: string; label: string };
export type HeaderUser = {
  name: string;
  email: string;
  roleLabel: string;
  home: string;
  homeLabel: string;
  staff: boolean;
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine-700/40 focus-visible:ring-offset-2 focus-visible:ring-offset-sand-50";

/* ------------------------------------------------------------------ */

function Monogram() {
  return (
    <span
      aria-hidden
      className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-marigold-600/40 bg-gradient-to-b from-marigold-400 to-marigold-500 font-display text-sm font-semibold text-pine-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-1px_0_rgba(0,0,0,0.08),0_1px_2px_rgba(15,34,30,0.15)] transition-transform duration-300 ease-out group-hover:-rotate-3 group-hover:scale-105"
    >
      GT
      {/* punched hole — the key-tag detail */}
      <span className="absolute -top-0.5 right-1 h-1.5 w-1.5 rounded-full border border-marigold-600/50 bg-sand-50" />
    </span>
  );
}

function Lockup({ href }: { href: string }) {
  return (
    <Link href={href} className={`group flex items-center gap-3 rounded-lg ${focusRing}`}>
      <Monogram />
      <span className="hidden leading-none sm:block">
        <span className="block font-display text-xl tracking-tight text-pine-900">
          Grand Tulip
        </span>
        <span className="mt-1 block text-[10px] uppercase tracking-[0.28em] text-ink-400">
          Gulshan · Dhaka
        </span>
      </span>
    </Link>
  );
}

/** Pill rail — the current section sits in a filled pine pill with a brass dot. */
function PillNav({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <nav aria-label="Main" className="hidden md:block">
      <ul className="flex items-center gap-0.5 rounded-full border border-sand-200/80 bg-white/70 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm transition-all duration-200 ease-out active:translate-y-px ${focusRing} ${
                  active
                    ? "bg-pine-900 font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(15,34,30,0.25)]"
                    : "text-ink-600 hover:bg-sand-100 hover:text-pine-900"
                }`}
              >
                <span
                  aria-hidden
                  className={`h-1.5 w-1.5 rounded-full bg-marigold-400 transition-all duration-200 ${
                    active ? "opacity-100" : "-ml-3.5 w-0 opacity-0"
                  }`}
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ------------------------------------------------------------------ */

function useLogout() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }
  return { logout, busy };
}

function UserMenu({ user, pathname }: { user: HeaderUser; pathname: string }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const { logout, busy } = useLogout();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const itemCls = `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-ink-900 transition-colors hover:bg-sand-100 ${focusRing}`;

  return (
    <div ref={wrap} className="relative hidden md:block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className={`group flex items-center gap-2.5 rounded-full border border-transparent py-1 pl-1 pr-2.5 transition-colors hover:border-sand-200 hover:bg-white/70 ${focusRing} ${
          open ? "border-sand-200 bg-white/80" : ""
        }`}
      >
        <span
          aria-hidden
          className="relative flex h-8 w-8 items-center justify-center rounded-[10px] bg-pine-800 font-display text-xs text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
        >
          {initials(user.name)}
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-sand-50 bg-marigold-400" />
        </span>
        <span className="hidden text-left leading-tight lg:block">
          <span className="block max-w-36 truncate text-sm font-medium text-ink-900">
            {user.name}
          </span>
          <span className="block text-[10px] uppercase tracking-[0.15em] text-ink-400">
            {user.roleLabel}
          </span>
        </span>
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className={`h-3.5 w-3.5 text-ink-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="menu-in absolute right-0 mt-2 w-64 origin-top-right overflow-hidden rounded-xl border border-sand-200 bg-white p-1.5 shadow-[0_18px_40px_-20px_rgba(15,34,30,0.45),0_2px_6px_-2px_rgba(15,34,30,0.12)]"
        >
          <div className="px-3 pb-2 pt-2">
            <p className="truncate text-sm font-medium text-ink-900">{user.name}</p>
            <p className="truncate text-xs text-ink-400">{user.email}</p>
          </div>
          <div className="mx-1.5 h-px bg-sand-200" />
          <div className="py-1">
            <Link role="menuitem" href={user.home} className={itemCls}>
              <MenuIcon kind="home" />
              {user.homeLabel}
            </Link>
            <Link role="menuitem" href="/dashboard/profile" className={itemCls}>
              <MenuIcon kind="profile" />
              Profile settings
            </Link>
          </div>
          <div className="mx-1.5 h-px bg-sand-200" />
          <div className="pt-1">
            <button
              role="menuitem"
              type="button"
              onClick={logout}
              disabled={busy}
              className={`${itemCls} disabled:opacity-50`}
            >
              <MenuIcon kind="out" />
              {busy ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuIcon({ kind }: { kind: "home" | "profile" | "out" }) {
  const path =
    kind === "home"
      ? "M3 8.5 8 4l5 4.5V13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8.5Z"
      : kind === "profile"
        ? "M8 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm-5 6a5 5 0 0 1 10 0"
        : "M6 3H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2m4-2 3-3-3-3m3 3H6";
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-4 w-4 shrink-0 text-ink-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */

function MobileMenu({
  items,
  user,
  pathname,
}: {
  items: NavItem[];
  user: HeaderUser | null;
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const { logout, busy } = useLogout();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className={`relative flex h-10 w-10 items-center justify-center rounded-lg text-pine-900 transition-colors hover:bg-sand-100 ${focusRing}`}
      >
        <span
          aria-hidden
          className={`absolute h-0.5 w-5 rounded-full bg-current transition-transform duration-300 ease-out ${
            open ? "rotate-45" : "-translate-y-1.5"
          }`}
        />
        <span
          aria-hidden
          className={`absolute h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-out ${
            open ? "scale-x-0 opacity-0" : ""
          }`}
        />
        <span
          aria-hidden
          className={`absolute h-0.5 w-5 rounded-full bg-current transition-transform duration-300 ease-out ${
            open ? "-rotate-45" : "translate-y-1.5"
          }`}
        />
      </button>

      {open && (
        <div
          id={panelId}
          className="menu-in absolute inset-x-0 top-full border-t border-sand-200 bg-sand-50/95 backdrop-blur-md shadow-[0_24px_40px_-24px_rgba(15,34,30,0.45)]"
        >
          <nav aria-label="Main" className="mx-auto max-w-6xl px-4 py-3">
            <ul className="space-y-0.5">
              {items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] transition-colors ${focusRing} ${
                        active
                          ? "bg-pine-900 font-medium text-white"
                          : "text-ink-900 hover:bg-sand-100"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`h-1.5 w-1.5 rounded-full ${active ? "bg-marigold-400" : "bg-sand-300"}`}
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-3 border-t border-sand-200 pt-3">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2">
                    <span
                      aria-hidden
                      className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-pine-800 font-display text-xs text-white"
                    >
                      {initials(user.name)}
                    </span>
                    <span className="min-w-0 leading-tight">
                      <span className="block truncate text-sm font-medium text-ink-900">
                        {user.name}
                      </span>
                      <span className="block text-[10px] uppercase tracking-[0.15em] text-ink-400">
                        {user.roleLabel}
                      </span>
                    </span>
                  </div>
                  <Link
                    href="/dashboard/profile"
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-ink-900 transition-colors hover:bg-sand-100 ${focusRing}`}
                  >
                    <MenuIcon kind="profile" />
                    Profile settings
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    disabled={busy}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[15px] text-ink-900 transition-colors hover:bg-sand-100 disabled:opacity-50 ${focusRing}`}
                  >
                    <MenuIcon kind="out" />
                    {busy ? "Signing out…" : "Sign out"}
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2 px-1">
                  <Link
                    href="/login"
                    className={`rounded-md border border-sand-300 bg-white px-4 py-2.5 text-center text-sm font-medium text-ink-900 transition-colors hover:border-pine-700 hover:text-pine-800 ${focusRing}`}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/rooms"
                    className={`rounded-md bg-pine-800 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-pine-700 ${focusRing}`}
                  >
                    Book a stay
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function SiteHeader({
  items,
  user,
  logoHref,
}: {
  items: NavItem[];
  user: HeaderUser | null;
  logoHref: string;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-40">
      {/* Brass rail — the key-tag metal, run along the top of the house */}
      <div
        aria-hidden
        className="h-0.5 bg-gradient-to-r from-marigold-600 via-marigold-400 to-marigold-600"
      />
      <div
        className={`relative border-b backdrop-blur-md transition-[background-color,box-shadow,border-color] duration-300 ${
          scrolled
            ? "border-sand-200 bg-sand-50/95 shadow-[0_12px_32px_-24px_rgba(15,34,30,0.5)]"
            : "border-sand-200/70 bg-sand-50/80"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Lockup href={logoHref} />

          <PillNav items={items} pathname={pathname} />

          <div className="flex items-center gap-2">
            {user ? (
              <UserMenu user={user} pathname={pathname} />
            ) : (
              <div className="hidden items-center gap-1 md:flex">
                <Link
                  href="/login"
                  className={`rounded-full px-3.5 py-2 text-sm text-ink-600 transition-colors hover:bg-sand-100 hover:text-pine-900 ${focusRing}`}
                >
                  Sign in
                </Link>
                <Link
                  href="/rooms"
                  className={`group relative overflow-hidden rounded-full bg-pine-800 px-4.5 py-2 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_1px_2px_rgba(15,34,30,0.3)] transition-all duration-200 hover:bg-pine-700 active:translate-y-px ${focusRing}`}
                >
                  <span className="relative z-10">Book a stay</span>
                  <span
                    aria-hidden
                    className="absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/10 transition-transform duration-500 ease-out group-hover:translate-x-[400%]"
                  />
                </Link>
              </div>
            )}
            <MobileMenu items={items} user={user} pathname={pathname} />
          </div>
        </div>
      </div>
    </header>
  );
}

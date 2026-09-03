"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string };

/**
 * Nav links with current-page indication: a brass underline that is fixed
 * for the active section and grows in on hover for the rest.
 */
export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <>
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`group relative px-3 py-2 text-sm transition-colors ${
              active
                ? "font-medium text-pine-900"
                : "text-ink-600 hover:text-pine-900"
            }`}
          >
            {item.label}
            <span
              aria-hidden
              className={`absolute inset-x-3 -bottom-0.5 h-0.5 origin-left rounded-full bg-marigold-500 transition-transform duration-200 ease-out ${
                active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
              }`}
            />
          </Link>
        );
      })}
    </>
  );
}

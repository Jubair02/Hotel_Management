import Link from "next/link";

export function SectionNav({
  items,
  active,
}: {
  items: { href: string; label: string }[];
  active: string;
}) {
  return (
    <nav className="mt-6 flex flex-wrap gap-1 border-b border-sand-200">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
            item.href === active
              ? "border-pine-800 text-pine-900"
              : "border-transparent text-ink-600 hover:text-pine-900"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/rooms", label: "Rooms" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/staff", label: "Staff" },
];

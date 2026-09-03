import Link from "next/link";
import { prisma } from "@/lib/db";
import { SectionNav, ADMIN_NAV } from "@/components/SectionNav";
import { StatusBadge } from "@/components/StatusBadge";
import { KeyTag } from "@/components/KeyTag";
import { ActionButton } from "@/components/ActionButton";
import { formatMoney } from "@/lib/format";

export const metadata = { title: "Rooms · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminRoomsPage() {
  const rooms = await prisma.room.findMany({ orderBy: { roomNumber: "asc" } });

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
        Admin
      </p>
      <div className="mt-1 flex items-end justify-between gap-4">
        <h1 className="font-display text-3xl text-pine-900">Rooms</h1>
        <Link
          href="/admin/rooms/new"
          className="rounded-md bg-pine-800 px-4 py-2 text-sm font-semibold text-white hover:bg-pine-700"
        >
          Add room
        </Link>
      </div>
      <SectionNav items={ADMIN_NAV} active="/admin/rooms" />

      <div className="mt-8 overflow-x-auto rounded-xl border border-sand-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand-200 text-left text-[11px] uppercase tracking-[0.1em] text-ink-400">
              <th className="px-4 py-3 font-semibold">Room</th>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Price / night</th>
              <th className="px-4 py-3 font-semibold">Sleeps</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.id} className="border-b border-sand-100 last:border-0">
                <td className="px-4 py-3">
                  <KeyTag roomNumber={room.roomNumber} />
                </td>
                <td className="px-4 py-3 font-medium">{room.name}</td>
                <td className="px-4 py-3 text-ink-600">{room.type}</td>
                <td className="px-4 py-3">
                  {formatMoney(room.pricePerNight.toString())}
                </td>
                <td className="px-4 py-3 text-ink-600">{room.capacity}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={room.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/rooms/${room.id}/edit`}
                      className="rounded-md border border-sand-300 bg-white px-3 py-1.5 text-sm font-medium hover:border-pine-700 hover:text-pine-800"
                    >
                      Edit
                    </Link>
                    <ActionButton
                      url={`/api/rooms/${room.id}`}
                      method="DELETE"
                      variant="danger"
                      confirmText={`Delete room ${room.roomNumber}? Rooms with booking history cannot be deleted.`}
                    >
                      Delete
                    </ActionButton>
                  </div>
                </td>
              </tr>
            ))}
            {rooms.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-400">
                  No rooms yet — add the first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

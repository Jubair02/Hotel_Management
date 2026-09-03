import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { SectionNav, ADMIN_NAV } from "@/components/SectionNav";
import { RoomForm } from "@/components/RoomForm";

export const metadata = { title: "Edit room · Admin" };

type Props = { params: Promise<{ id: string }> };

export default async function EditRoomPage({ params }: Props) {
  const { id } = await params;
  const [room, occupant, openTask] = await Promise.all([
    prisma.room.findUnique({ where: { id } }),
    prisma.booking.findFirst({
      where: { roomId: id, status: "CHECKED_IN" },
      select: { guestName: true, checkOutDate: true },
    }),
    prisma.housekeepingTask.findFirst({
      where: {
        roomId: id,
        status: { in: ["PENDING", "IN_PROGRESS", "MAINTENANCE_REPORTED"] },
      },
      select: { status: true },
    }),
  ]);
  if (!room) notFound();

  // The API enforces these; the form explains them up front so the admin
  // isn't surprised by a 409 after filling everything in.
  const statusLock = occupant
    ? {
        locked: true,
        note: `${occupant.guestName} is checked in, so this room stays OCCUPIED until Reception checks them out.`,
      }
    : openTask
      ? {
          locked: false,
          note: `An open housekeeping task (${openTask.status
            .replaceAll("_", " ")
            .toLowerCase()}) is attached — marking it done from Housekeeping is what returns the room to AVAILABLE.`,
        }
      : undefined;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
        Admin
      </p>
      <h1 className="mt-1 font-display text-3xl text-pine-900">
        Edit room {room.roomNumber}
      </h1>
      <SectionNav items={ADMIN_NAV} active="/admin/rooms" />
      <div className="mt-8 rounded-xl border border-sand-200 bg-white p-6">
        <RoomForm
          roomId={room.id}
          statusLock={statusLock}
          initial={{
            roomNumber: room.roomNumber,
            name: room.name,
            type: room.type,
            description: room.description,
            pricePerNight: room.pricePerNight.toString(),
            capacity: String(room.capacity),
            status: room.status,
            images: room.images.join("\n"),
            amenities: room.amenities.join(", "),
          }}
        />
      </div>
    </div>
  );
}

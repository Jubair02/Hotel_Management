import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { SectionNav, ADMIN_NAV } from "@/components/SectionNav";
import { RoomForm } from "@/components/RoomForm";

export const metadata = { title: "Edit room · Admin" };

type Props = { params: Promise<{ id: string }> };

export default async function EditRoomPage({ params }: Props) {
  const { id } = await params;
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) notFound();

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

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/guard";
import { updateRoomSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

/** GET /api/rooms/:id — public room details. */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  return NextResponse.json({ room });
}

/** PATCH /api/rooms/:id — update a room (ADMIN). */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateRoomSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const room = await prisma.room.update({ where: { id }, data: parsed.data })
    .catch(() => null);
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  return NextResponse.json({ room });
}

/** DELETE /api/rooms/:id — delete a room with no bookings (ADMIN). */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  const { id } = await params;
  const bookingCount = await prisma.booking.count({ where: { roomId: id } });
  if (bookingCount > 0) {
    return NextResponse.json(
      {
        error:
          "Room has booking history and cannot be deleted. Set its status to MAINTENANCE instead.",
      },
      { status: 409 }
    );
  }

  await prisma.housekeepingTask.deleteMany({ where: { roomId: id } });
  const room = await prisma.room.delete({ where: { id } }).catch(() => null);
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

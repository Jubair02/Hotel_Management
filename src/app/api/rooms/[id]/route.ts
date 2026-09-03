import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/guard";
import { updateRoomSchema } from "@/lib/validation";
import { roomStatusConflict } from "@/lib/room-status";

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

  const current = await prisma.room.findUnique({
    where: { id },
    select: { status: true, roomNumber: true },
  });
  if (!current) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  if (parsed.data.status && parsed.data.status !== current.status) {
    const conflict = await roomStatusConflict(id, current.roomNumber, parsed.data.status);
    if (conflict) {
      return NextResponse.json({ error: conflict }, { status: 409 });
    }
  }

  if (parsed.data.roomNumber && parsed.data.roomNumber !== current.roomNumber) {
    const taken = await prisma.room.findUnique({
      where: { roomNumber: parsed.data.roomNumber },
      select: { id: true },
    });
    if (taken) {
      return NextResponse.json(
        { error: `Room ${parsed.data.roomNumber} already exists` },
        { status: 409 }
      );
    }
  }

  const room = await prisma.room.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ room });
}

/** DELETE /api/rooms/:id — delete a room with no history (ADMIN). */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  const { id } = await params;
  const [bookingCount, taskCount] = await Promise.all([
    prisma.booking.count({ where: { roomId: id } }),
    prisma.housekeepingTask.count({ where: { roomId: id } }),
  ]);
  // History is never silently destroyed — bookings and housekeeping
  // records both block deletion.
  if (bookingCount > 0 || taskCount > 0) {
    return NextResponse.json(
      {
        error:
          bookingCount > 0
            ? "Room has booking history and cannot be deleted. Set its status to MAINTENANCE instead."
            : "Room has housekeeping history and cannot be deleted. Set its status to MAINTENANCE instead.",
      },
      { status: 409 }
    );
  }

  const room = await prisma.room.delete({ where: { id } }).catch(() => null);
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

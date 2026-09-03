import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/guard";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"]).optional(),
  notes: z.string().max(500).optional(),
});

/** GET /api/bookings/:id — owner or staff. */
export async function GET(_req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { room: true, payments: true, guest: { select: { name: true, email: true } } },
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const staff = session.role === "ADMIN" || session.role === "RECEPTIONIST";
  if (!staff && booking.guestId !== session.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ booking });
}

/** PATCH /api/bookings/:id — staff update (confirm, cancel, notes). */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { error } = await requireAuth(["ADMIN", "RECEPTIONIST"]);
  if (error) return error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const existing = await prisma.booking.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (
    parsed.data.status &&
    (existing.status === "CHECKED_IN" || existing.status === "CHECKED_OUT")
  ) {
    return NextResponse.json(
      { error: `Cannot change status of a ${existing.status} booking here` },
      { status: 409 }
    );
  }

  const booking = await prisma.booking.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json({ booking });
}

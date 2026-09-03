import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/guard";
import {
  roomSchema,
  roomListQuerySchema,
  pickQuery,
  queryErrorMessage,
} from "@/lib/validation";

/** GET /api/rooms — public room catalogue (filterable by type/status). */
export async function GET(req: NextRequest) {
  const parsed = roomListQuerySchema.safeParse(
    pickQuery(req.nextUrl.searchParams, ["type", "status"])
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: queryErrorMessage(parsed.error) },
      { status: 400 }
    );
  }
  const { type, status } = parsed.data;

  const rooms = await prisma.room.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: { roomNumber: "asc" },
  });

  return NextResponse.json({ rooms });
}

/** POST /api/rooms — create a room (ADMIN). */
export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = roomSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  // A brand-new room has no guest in it; OCCUPIED only ever comes from
  // check-in.
  if (parsed.data.status === "OCCUPIED") {
    return NextResponse.json(
      { error: "A new room cannot start as OCCUPIED — rooms become occupied through check-in" },
      { status: 400 }
    );
  }

  const existing = await prisma.room.findUnique({
    where: { roomNumber: parsed.data.roomNumber },
  });
  if (existing) {
    return NextResponse.json(
      { error: `Room ${parsed.data.roomNumber} already exists` },
      { status: 409 }
    );
  }

  const room = await prisma.room.create({ data: parsed.data });
  return NextResponse.json({ room }, { status: 201 });
}

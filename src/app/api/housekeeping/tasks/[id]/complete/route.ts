import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/guard";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/housekeeping/tasks/:id/complete (ADMIN, HOUSEKEEPING)
 * Task → DONE, room → AVAILABLE. This is the only path that returns a
 * CLEANING room to the bookable pool.
 */
export async function POST(_req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth(["ADMIN", "HOUSEKEEPING"]);
  if (error) return error;

  const { id } = await params;
  const task = await prisma.housekeepingTask.findUnique({ where: { id } });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  if (task.status === "DONE") {
    return NextResponse.json(
      { error: "Task is already completed" },
      { status: 409 }
    );
  }

  const [updated] = await prisma.$transaction([
    prisma.housekeepingTask.update({
      where: { id },
      data: {
        status: "DONE",
        completedAt: new Date(),
        startedAt: task.startedAt ?? new Date(),
        assignedToId: task.assignedToId ?? session.sub,
      },
    }),
    prisma.room.update({
      where: { id: task.roomId },
      data: { status: "AVAILABLE" },
    }),
  ]);

  return NextResponse.json({ task: updated });
}

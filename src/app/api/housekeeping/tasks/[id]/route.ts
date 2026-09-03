import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/guard";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  action: z.enum(["start", "report_maintenance"]),
  notes: z.string().max(500).optional(),
});

/**
 * PATCH /api/housekeeping/tasks/:id (ADMIN, HOUSEKEEPING)
 * start              → task IN_PROGRESS (assigned to the caller)
 * report_maintenance → task MAINTENANCE_REPORTED, room MAINTENANCE
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth(["ADMIN", "HOUSEKEEPING"]);
  if (error) return error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

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

  if (parsed.data.action === "start") {
    const updated = await prisma.housekeepingTask.update({
      where: { id },
      data: {
        status: "IN_PROGRESS",
        startedAt: task.startedAt ?? new Date(),
        assignedToId: task.assignedToId ?? session.sub,
        ...(parsed.data.notes ? { notes: parsed.data.notes } : {}),
      },
    });
    return NextResponse.json({ task: updated });
  }

  // report_maintenance
  const [updated] = await prisma.$transaction([
    prisma.housekeepingTask.update({
      where: { id },
      data: {
        status: "MAINTENANCE_REPORTED",
        assignedToId: task.assignedToId ?? session.sub,
        notes: parsed.data.notes ?? task.notes,
      },
    }),
    prisma.room.update({
      where: { id: task.roomId },
      data: { status: "MAINTENANCE" },
    }),
  ]);

  return NextResponse.json({ task: updated });
}

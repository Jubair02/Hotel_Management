import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/guard";
import {
  taskListQuerySchema,
  pickQuery,
  queryErrorMessage,
} from "@/lib/validation";

/** GET /api/housekeeping/tasks (ADMIN, HOUSEKEEPING) */
export async function GET(req: NextRequest) {
  const { error } = await requireAuth(["ADMIN", "HOUSEKEEPING"]);
  if (error) return error;

  const parsed = taskListQuerySchema.safeParse(
    pickQuery(req.nextUrl.searchParams, ["status"])
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: queryErrorMessage(parsed.error) },
      { status: 400 }
    );
  }
  const { status } = parsed.data;

  const tasks = await prisma.housekeepingTask.findMany({
    where: status ? { status } : {},
    include: {
      room: { select: { roomNumber: true, name: true, status: true } },
      assignedTo: { select: { name: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  return NextResponse.json({ tasks });
}

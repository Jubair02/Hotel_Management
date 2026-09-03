import type { RoomStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

const OPEN_TASK_STATUSES = ["PENDING", "IN_PROGRESS", "MAINTENANCE_REPORTED"] as const;

/**
 * A room's status is mostly a *consequence* of the workflow (check-in →
 * OCCUPIED, check-out → CLEANING, task done → AVAILABLE). Hand-editing it
 * must not contradict that record:
 *  - a room with a checked-in guest can only be OCCUPIED;
 *  - a room with nobody checked in cannot be set OCCUPIED;
 *  - a room with an open housekeeping task cannot be set AVAILABLE — the
 *    task is completed from Housekeeping, which is what releases the room.
 * Returns an error message, or null when the change is consistent.
 */
export async function roomStatusConflict(
  roomId: string,
  roomNumber: string,
  next: RoomStatus
): Promise<string | null> {
  const occupant = await prisma.booking.findFirst({
    where: { roomId, status: "CHECKED_IN" },
    select: { guestName: true },
  });
  if (occupant && next !== "OCCUPIED") {
    return `Room ${roomNumber} is occupied by ${occupant.guestName} — check them out from Reception before changing its status`;
  }
  if (!occupant && next === "OCCUPIED") {
    return `Nobody is checked into room ${roomNumber} — rooms become occupied through check-in at Reception`;
  }
  if (next === "AVAILABLE") {
    const openTask = await prisma.housekeepingTask.findFirst({
      where: { roomId, status: { in: [...OPEN_TASK_STATUSES] } },
      select: { status: true },
    });
    if (openTask) {
      return `Room ${roomNumber} has an open housekeeping task (${openTask.status.replaceAll("_", " ").toLowerCase()}) — mark it done from Housekeeping to return the room to service`;
    }
  }
  return null;
}

import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { KeyTag } from "@/components/KeyTag";
import { ActionButton } from "@/components/ActionButton";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Housekeeping" };
export const dynamic = "force-dynamic";

export default async function HousekeepingPage() {
  const [openTasks, doneTasks, rooms] = await Promise.all([
    prisma.housekeepingTask.findMany({
      where: { status: { in: ["PENDING", "IN_PROGRESS", "MAINTENANCE_REPORTED"] } },
      include: {
        room: { select: { roomNumber: true, name: true, status: true } },
        assignedTo: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.housekeepingTask.findMany({
      where: { status: "DONE" },
      include: {
        room: { select: { roomNumber: true, name: true, status: true } },
        assignedTo: { select: { name: true } },
      },
      orderBy: { completedAt: "desc" },
      take: 10,
    }),
    prisma.room.findMany({
      select: { id: true, roomNumber: true, status: true },
      orderBy: { roomNumber: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
        Housekeeping
      </p>
      <h1 className="mt-1 font-display text-3xl text-pine-900">
        Rooms to turn
      </h1>
      <p className="mt-2 text-sm text-ink-600">
        Marking a room clean is what returns it to the bookable pool.
      </p>

      {/* Room status board */}
      <div className="mt-8 flex flex-wrap gap-2">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="flex items-center gap-2 rounded-lg border border-sand-200 bg-white px-3 py-2"
          >
            <KeyTag roomNumber={room.roomNumber} />
            <StatusBadge status={room.status} />
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl text-pine-900">Open tasks</h2>
        <div className="mt-3 rounded-xl border border-sand-200 bg-white">
          {openTasks.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-400">
              All caught up — every room is turned.
            </p>
          ) : (
            openTasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-4 border-b border-sand-100 px-5 py-4 last:border-0"
              >
                <div className="flex items-center gap-4">
                  <KeyTag roomNumber={task.room.roomNumber} />
                  <div>
                    <p className="font-medium">{task.room.name}</p>
                    <p className="text-xs text-ink-400">
                      {task.notes ?? "Cleaning"}
                      {task.assignedTo && ` · ${task.assignedTo.name}`}
                      {task.startedAt &&
                        ` · started ${formatDateTime(task.startedAt)}`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={task.status} />
                  {task.status === "PENDING" && (
                    <ActionButton
                      url={`/api/housekeeping/tasks/${task.id}`}
                      method="PATCH"
                      body={{ action: "start" }}
                    >
                      Start cleaning
                    </ActionButton>
                  )}
                  {(task.status === "PENDING" ||
                    task.status === "IN_PROGRESS") && (
                    <>
                      <ActionButton
                        url={`/api/housekeeping/tasks/${task.id}/complete`}
                        variant="primary"
                      >
                        Mark clean
                      </ActionButton>
                      <ActionButton
                        url={`/api/housekeeping/tasks/${task.id}`}
                        method="PATCH"
                        body={{ action: "report_maintenance" }}
                        variant="danger"
                        confirmText={`Report a maintenance issue in room ${task.room.roomNumber}? The room will be taken out of service.`}
                      >
                        Report issue
                      </ActionButton>
                    </>
                  )}
                  {task.status === "MAINTENANCE_REPORTED" && (
                    <ActionButton
                      url={`/api/housekeeping/tasks/${task.id}/complete`}
                    >
                      Issue fixed — mark clean
                    </ActionButton>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-pine-900">Recently completed</h2>
        <div className="mt-3 rounded-xl border border-sand-200 bg-white">
          {doneTasks.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-400">
              Nothing completed yet.
            </p>
          ) : (
            doneTasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-4 border-b border-sand-100 px-5 py-3 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <KeyTag roomNumber={task.room.roomNumber} />
                  <p className="text-sm text-ink-600">
                    {task.assignedTo?.name ?? "Unassigned"}
                    {task.completedAt &&
                      ` · done ${formatDateTime(task.completedAt)}`}
                  </p>
                </div>
                <StatusBadge status="DONE" />
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

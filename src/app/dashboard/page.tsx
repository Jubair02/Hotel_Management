import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { KeyTag } from "@/components/KeyTag";
import { SectionNav } from "@/components/SectionNav";
import { StatusBadge } from "@/components/StatusBadge";
import { ActionButton } from "@/components/ActionButton";
import { formatMoney, formatDate } from "@/lib/format";

export const metadata = { title: "My bookings" };

export default async function GuestDashboard() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard");

  const bookings = await prisma.booking.findMany({
    where: { guestId: session.sub },
    include: { room: true, payments: true },
    orderBy: { createdAt: "desc" },
  });

  const upcoming = bookings.filter(
    (b) => b.status === "PENDING" || b.status === "CONFIRMED" || b.status === "CHECKED_IN"
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
        Guest dashboard
      </p>
      <h1 className="mt-1 font-display text-3xl text-pine-900">
        Hello, {session.name.split(" ")[0]}
      </h1>
      <p className="mt-2 text-sm text-ink-600">
        {upcoming.length === 0
          ? "No upcoming stays — the rooftop tea is waiting whenever you are."
          : `You have ${upcoming.length} active booking${upcoming.length === 1 ? "" : "s"}.`}
      </p>

      <SectionNav
        items={[
          { href: "/dashboard", label: "My bookings" },
          { href: "/dashboard/profile", label: "Profile" },
        ]}
        active="/dashboard"
      />

      {bookings.length === 0 ? (
        <div className="mt-10 rounded-xl border border-sand-200 bg-white p-12 text-center">
          <p className="font-display text-xl text-pine-900">No bookings yet</p>
          <p className="mt-2 text-sm text-ink-600">
            Find a room for your next trip to Dhaka.
          </p>
          <Link
            href="/rooms"
            className="mt-5 inline-block rounded-md bg-pine-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pine-700"
          >
            Search rooms
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {bookings.map((b) => {
            const paid = b.payments.some((p) => p.status === "PAID");
            const canPay =
              !paid &&
              (b.status === "PENDING" ||
                (b.status === "CONFIRMED" &&
                  !b.payments.some(
                    (p) => p.provider === "CASH" && p.status === "PENDING"
                  )));
            const canCancel =
              b.status === "PENDING" || b.status === "CONFIRMED";

            return (
              <div
                key={b.id}
                className="rounded-xl border border-sand-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <KeyTag roomNumber={b.room.roomNumber} />
                    <div>
                      <Link
                        href={`/bookings/${b.id}/confirmation`}
                        className="font-display text-lg text-pine-900 hover:underline underline-offset-4"
                      >
                        {b.room.name}
                      </Link>
                      <p className="mt-0.5 text-sm text-ink-600">
                        {formatDate(b.checkInDate)} →{" "}
                        {formatDate(b.checkOutDate)} · {b.totalNights} night
                        {b.totalNights === 1 ? "" : "s"} ·{" "}
                        {formatMoney(b.totalAmount.toString())}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <StatusBadge status={b.status} />
                        <StatusBadge
                          status={
                            paid
                              ? "PAID"
                              : b.payments[0]?.status ?? "PENDING"
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {canPay && (
                      <Link
                        href={`/bookings/${b.id}/payment`}
                        className="rounded-md bg-pine-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-pine-700"
                      >
                        Pay now
                      </Link>
                    )}
                    {canCancel && (
                      <ActionButton
                        url={`/api/bookings/${b.id}/cancel`}
                        variant="danger"
                        confirmText="Cancel this booking? This cannot be undone."
                      >
                        Cancel booking
                      </ActionButton>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

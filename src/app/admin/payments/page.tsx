import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { SectionNav, ADMIN_NAV } from "@/components/SectionNav";
import { StatusBadge } from "@/components/StatusBadge";
import { KeyTag } from "@/components/KeyTag";
import { ActionButton } from "@/components/ActionButton";
import { formatMoney, formatDate, formatDateTime } from "@/lib/format";
import { parseDateOnly, todayUtc } from "@/lib/availability";

export const metadata = { title: "Payments · Admin" };
export const dynamic = "force-dynamic";

const STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"] as const;
const PROVIDERS = ["MOCK", "SSLCOMMERZ", "BKASH", "CASH"] as const;
const PROVIDER_LABEL: Record<(typeof PROVIDERS)[number], string> = {
  MOCK: "Online (sandbox)",
  SSLCOMMERZ: "SSLCommerz",
  BKASH: "bKash",
  CASH: "Cash at desk",
};

type Search = Promise<{
  status?: string;
  provider?: string;
  from?: string;
  to?: string;
}>;

const inputCls =
  "rounded-md border border-sand-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pine-700/40";

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const sp = await searchParams;
  const status = STATUSES.find((s) => s === sp.status);
  const provider = PROVIDERS.find((p) => p === sp.provider);
  const from = sp.from ? parseDateOnly(sp.from) : null;
  const to = sp.to ? parseDateOnly(sp.to) : null;
  const toExclusive = to ? new Date(to.getTime() + 86_400_000) : null;

  const today = todayUtc();
  const tomorrow = new Date(today.getTime() + 86_400_000);
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));

  const where: Prisma.PaymentWhereInput = {
    ...(status ? { status } : {}),
    ...(provider ? { provider } : {}),
    ...(from || toExclusive
      ? {
          createdAt: {
            ...(from ? { gte: from } : {}),
            ...(toExclusive ? { lt: toExclusive } : {}),
          },
        }
      : {}),
  };

  const [payments, todayPaid, monthPaid, outstanding, monthRefunded] =
    await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          booking: {
            select: {
              id: true,
              guestName: true,
              status: true,
              checkInDate: true,
              room: { select: { roomNumber: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.payment.aggregate({
        where: { status: "PAID", paidAt: { gte: today, lt: tomorrow } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: { status: "PAID", paidAt: { gte: monthStart } },
        _sum: { amount: true },
        _count: true,
      }),
      // Money still owed on live bookings: pending payments whose booking
      // hasn't been cancelled or closed.
      prisma.payment.aggregate({
        where: {
          status: "PENDING",
          booking: { status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] } },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: { status: "REFUNDED", updatedAt: { gte: monthStart } },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

  const listTotal = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum.add(p.amount), new Prisma.Decimal(0));

  const tiles = [
    {
      label: "Collected today",
      value: formatMoney(todayPaid._sum.amount?.toString() ?? "0"),
      hint: `${todayPaid._count} payment${todayPaid._count === 1 ? "" : "s"}`,
    },
    {
      label: "Collected this month",
      value: formatMoney(monthPaid._sum.amount?.toString() ?? "0"),
      hint: `${monthPaid._count} payment${monthPaid._count === 1 ? "" : "s"}`,
    },
    {
      label: "Outstanding",
      value: formatMoney(outstanding._sum.amount?.toString() ?? "0"),
      hint: `${outstanding._count} pending on live bookings`,
    },
    {
      label: "Refunded this month",
      value: formatMoney(monthRefunded._sum.amount?.toString() ?? "0"),
      hint: `${monthRefunded._count} refund${monthRefunded._count === 1 ? "" : "s"}`,
    },
  ];

  const filtered = Boolean(status || provider || from || to);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
        Admin
      </p>
      <h1 className="mt-1 font-display text-3xl text-pine-900">Payments ledger</h1>
      <SectionNav items={ADMIN_NAV} active="/admin/payments" />

      <section
        className="mt-8 grid grid-cols-2 divide-sand-200 rounded-xl border border-sand-200 bg-white sm:grid-cols-4 sm:divide-x"
        aria-label="Payment totals"
      >
        {tiles.map((t) => (
          <div key={t.label} className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">
              {t.label}
            </p>
            <p className="mt-1 font-display text-2xl text-pine-900 [font-variant-numeric:tabular-nums]">
              {t.value}
            </p>
            <p className="text-xs text-ink-400">{t.hint}</p>
          </div>
        ))}
      </section>

      <form
        method="get"
        className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-sand-200 bg-white p-4"
      >
        <label className="block text-sm">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">
            Status
          </span>
          <select name="status" defaultValue={status ?? ""} className={inputCls}>
            <option value="">Any</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">
            Method
          </span>
          <select name="provider" defaultValue={provider ?? ""} className={inputCls}>
            <option value="">Any</option>
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {PROVIDER_LABEL[p]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">
            From
          </span>
          <input type="date" name="from" defaultValue={from ? sp.from : ""} className={inputCls} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">
            To
          </span>
          <input type="date" name="to" defaultValue={to ? sp.to : ""} className={inputCls} />
        </label>
        <button
          type="submit"
          className="rounded-md bg-pine-800 px-4 py-2 text-sm font-semibold text-white hover:bg-pine-700"
        >
          Filter
        </button>
        {filtered && (
          <Link href="/admin/payments" className="px-2 py-2 text-sm text-ink-600 hover:text-pine-800">
            Clear
          </Link>
        )}
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-sand-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand-200 text-left text-[11px] uppercase tracking-[0.1em] text-ink-400">
              <th className="px-4 py-3 font-semibold">Created</th>
              <th className="px-4 py-3 font-semibold">Guest</th>
              <th className="px-4 py-3 font-semibold">Room</th>
              <th className="px-4 py-3 font-semibold">Method</th>
              <th className="px-4 py-3 font-semibold">Reference</th>
              <th className="px-4 py-3 font-semibold text-right">Amount</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Settled</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => {
              const liveBooking =
                p.booking.status !== "CANCELLED" && p.booking.status !== "CHECKED_OUT";
              return (
                <tr key={p.id} className="border-b border-sand-100 last:border-0 align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-ink-600 [font-variant-numeric:tabular-nums]">
                    {formatDateTime(p.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.booking.guestName}</p>
                    <p className="text-xs text-ink-400">
                      stay from {formatDate(p.booking.checkInDate)} ·{" "}
                      <Link
                        href={`/admin/bookings?guestName=${encodeURIComponent(p.booking.guestName)}`}
                        className="underline underline-offset-2 hover:text-pine-800"
                      >
                        booking
                      </Link>
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <KeyTag roomNumber={p.booking.room.roomNumber} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-600">
                    {PROVIDER_LABEL[p.provider]}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-600">
                    {p.transactionId ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right [font-variant-numeric:tabular-nums]">
                    {formatMoney(p.amount.toString())}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-600 [font-variant-numeric:tabular-nums]">
                    {p.paidAt ? formatDateTime(p.paidAt) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      {p.status === "PENDING" && liveBooking && (
                        <ActionButton url={`/api/payments/${p.id}/mark-paid`}>
                          Mark paid
                        </ActionButton>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {payments.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <p className="font-display text-lg text-pine-900">No payments here</p>
                  <p className="mt-1 text-sm text-ink-400">
                    {filtered ? "Nothing matches these filters." : "Payments appear as guests book."}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
          {payments.length > 0 && (
            <tfoot>
              <tr className="border-t border-sand-200 bg-sand-50 text-sm">
                <td colSpan={5} className="px-4 py-3 text-ink-600">
                  {payments.length} payment{payments.length === 1 ? "" : "s"} shown
                  {payments.length === 200 ? " (latest 200)" : ""} · settled total
                </td>
                <td className="px-4 py-3 text-right font-semibold [font-variant-numeric:tabular-nums]">
                  {formatMoney(listTotal.toString())}
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

export const metadata = { title: "Terms of stay" };

const SECTIONS = [
  {
    title: "Bookings",
    body: "A booking holds your room once it is confirmed — by completed online payment or by choosing to pay at the hotel. Check-out day is not charged: a stay from the 10th to the 15th is five nights.",
  },
  {
    title: "Payment",
    body: "Online payments are confirmed only after the payment gateway verifies the transaction. If you choose to pay at the hotel, the full amount is due at the front desk no later than check-out.",
  },
  {
    title: "Cancellation",
    body: "You can cancel a pending or confirmed booking from your dashboard at no charge before check-in. Online payments on cancelled bookings are marked for refund and returned through the original payment method.",
  },
  {
    title: "Check-in and check-out",
    body: "Check-in is from 2:00 PM and check-out is by 12:00 PM. Early arrivals and late departures are at the front desk's discretion, subject to availability.",
  },
  {
    title: "The house",
    body: "Rooms sleep the stated capacity, no more. Smoking is limited to the rooftop terrace. Damage beyond normal wear is charged to the booking.",
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
        Grand Tulip
      </p>
      <h1 className="mt-1 font-display text-3xl text-pine-900">
        Terms of stay
      </h1>
      <p className="mt-3 text-sm text-ink-600">
        The house rules, written to be read.
      </p>

      <div className="mt-10 space-y-8">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="font-display text-xl text-pine-900">{s.title}</h2>
            <p className="mt-2 leading-relaxed text-ink-600">{s.body}</p>
          </section>
        ))}
      </div>

      <p className="mt-12 border-t border-sand-200 pt-6 text-xs text-ink-400">
        This is a portfolio demonstration project; these terms are
        illustrative. Questions: reception@grandtulip.com.
      </p>
    </div>
  );
}

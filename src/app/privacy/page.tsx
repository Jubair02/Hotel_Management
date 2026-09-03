export const metadata = { title: "Privacy policy" };

const SECTIONS = [
  {
    title: "What we collect",
    body: "Your name, email address, phone number, and the details of your bookings — dates, room, guest count, and payment records. That's what running a hotel requires; we don't collect anything else.",
  },
  {
    title: "How it's used",
    body: "To hold your reservation, check you in and out, settle payment, and contact you about your stay. Booking history is kept so the front desk can help you with past and future visits.",
  },
  {
    title: "Who can see it",
    body: "Hotel staff with a reason to: reception sees bookings for arrivals and departures, housekeeping sees room assignments only, and management sees operational records. We don't sell or share guest data with third parties.",
  },
  {
    title: "Payment details",
    body: "Card and mobile-wallet payments are processed by the payment gateway; we store only the transaction reference and its status, never card numbers.",
  },
  {
    title: "Your choices",
    body: "You can update your details or change your password from your profile at any time. To have your account removed, ask at the front desk or email reception@grandtulip.com.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
        Grand Tulip
      </p>
      <h1 className="mt-1 font-display text-3xl text-pine-900">
        Privacy policy
      </h1>
      <p className="mt-3 text-sm text-ink-600">
        In short: we keep the data a hotel needs to host you, and nothing more.
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
        This is a portfolio demonstration project; no real guest data is
        collected. Questions: reception@grandtulip.com.
      </p>
    </div>
  );
}

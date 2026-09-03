"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const inputCls =
  "w-full rounded-md border border-sand-300 bg-white px-3 py-2 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-pine-700/40 focus:border-pine-700";

const STAFF_ROLES = [
  { value: "RECEPTIONIST", label: "Receptionist", hint: "Front desk — arrivals, payments, check-in/out" },
  { value: "HOUSEKEEPING", label: "Housekeeping", hint: "Cleaning tasks and maintenance reports" },
  { value: "ADMIN", label: "Admin", hint: "Full access, including rooms and staff" },
];

/**
 * Admin creates a staff account. The role is chosen here — public
 * registration can only ever produce a GUEST.
 */
export function StaffForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "RECEPTIONIST",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof typeof form>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          password: form.password,
          role: form.role,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Could not create the account");
        return;
      }
      router.push("/admin/staff");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const selected = STAFF_ROLES.find((r) => r.value === form.role);

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Full name</span>
          <input
            required
            minLength={2}
            value={form.name}
            onChange={set("name")}
            className={inputCls}
            autoComplete="off"
            placeholder="Rafiq Chowdhury"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Role</span>
          <select value={form.role} onChange={set("role")} className={inputCls}>
            {STAFF_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          {selected && (
            <span className="mt-1 block text-xs text-ink-400">{selected.hint}</span>
          )}
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Work email</span>
          <input
            type="email"
            required
            value={form.email}
            onChange={set("email")}
            className={inputCls}
            autoComplete="off"
            placeholder="name@grandtulip.com"
          />
          <span className="mt-1 block text-xs text-ink-400">
            This is their sign-in.
          </span>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            Phone <span className="text-ink-400">(optional)</span>
          </span>
          <input
            value={form.phone}
            onChange={set("phone")}
            className={inputCls}
            autoComplete="off"
            placeholder="+880 17…"
          />
        </label>
      </div>

      <label className="block sm:max-w-sm">
        <span className="mb-1 block text-sm font-medium">Temporary password</span>
        <input
          type="text"
          required
          minLength={6}
          value={form.password}
          onChange={set("password")}
          className={`${inputCls} font-mono`}
          autoComplete="new-password"
        />
        <span className="mt-1 block text-xs text-ink-400">
          Share it with them privately — they can change it from their profile.
        </span>
      </label>

      {error && (
        <p className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-pine-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pine-700 disabled:opacity-60"
      >
        {busy ? "Creating…" : "Create staff account"}
      </button>
    </form>
  );
}

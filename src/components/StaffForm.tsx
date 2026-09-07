"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const inputCls =
  "w-full rounded-md border border-sand-300 bg-white px-3 py-2 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-pine-700/40 focus:border-pine-700 disabled:cursor-not-allowed disabled:bg-sand-50 disabled:text-ink-400";

const STAFF_ROLES = [
  {
    value: "RECEPTIONIST",
    label: "Receptionist",
    hint: "Front desk — arrivals, payments, check-in/out",
  },
  {
    value: "HOUSEKEEPING",
    label: "Housekeeping",
    hint: "Cleaning tasks and maintenance reports",
  },
  { value: "ADMIN", label: "Admin", hint: "Full access, including rooms and staff" },
];

const GUEST_ROLE = {
  value: "GUEST",
  label: "Guest (no staff access)",
  hint: "Keeps the account and its booking history, but removes staff access",
};

const STATUSES = [
  { value: "ACTIVE", label: "Active", hint: "Can sign in and work as normal" },
  {
    value: "SUSPENDED",
    label: "Suspended",
    hint: "Cannot sign in; any open session ends immediately",
  },
];

export type StaffFormValues = {
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
};

/**
 * One form for both creating and editing an account.
 *
 * Create mode (no `userId`): staff roles only, password required — public
 * registration is the only other way in and it always makes a GUEST.
 * Edit mode: every field is editable, the password box resets it only when
 * filled, and role/status are locked when an admin edits their own row.
 */
export function StaffForm({
  userId,
  initial,
  selfEdit,
}: {
  userId?: string;
  initial?: StaffFormValues;
  /** True when an admin is editing their own account. */
  selfEdit?: boolean;
}) {
  const router = useRouter();
  const editing = Boolean(userId);

  const [form, setForm] = useState<StaffFormValues & { password: string }>({
    name: initial?.name ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    role: initial?.role ?? "RECEPTIONIST",
    status: initial?.status ?? "ACTIVE",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof typeof form>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  const roleOptions = editing ? [...STAFF_ROLES, GUEST_ROLE] : STAFF_ROLES;
  const selectedRole = roleOptions.find((r) => r.value === form.role);
  const selectedStatus = STATUSES.find((s) => s.value === form.status);

  /** Warn before the two changes that take someone's access away. */
  function confirmed(): boolean {
    if (!editing || !initial) return true;
    const who = initial.name;
    if (form.role === "GUEST" && initial.role !== "GUEST") {
      return window.confirm(
        `Remove ${who} from staff? They keep their account as a guest and will be signed out.`
      );
    }
    if (form.status === "SUSPENDED" && initial.status !== "SUSPENDED") {
      return window.confirm(
        `Suspend ${who}? They will be signed out immediately and cannot sign in until you restore the account.`
      );
    }
    return true;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmed()) return;

    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const payload: Record<string, string> = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
      };
      if (!editing || !selfEdit) {
        payload.role = form.role;
        if (editing) payload.status = form.status;
      }
      if (form.password) payload.password = form.password;

      const res = await fetch(editing ? `/api/users/${userId}` : "/api/users", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Could not save the account");
        return;
      }

      if (!editing) {
        router.push("/admin/staff");
        router.refresh();
        return;
      }

      const changed: string[] = data?.changed ?? [];
      setForm((f) => ({ ...f, password: "" }));
      setNotice(
        changed.length === 0
          ? "No changes to save."
          : data?.signedOut
            ? `Saved. ${form.name.trim()} has been signed out and needs to sign in again.`
            : changed.includes("password")
              ? "Saved. Share the new password with them privately."
              : "Saved."
      );
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

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
          <select
            value={form.role}
            onChange={set("role")}
            disabled={selfEdit}
            className={inputCls}
          >
            {roleOptions.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-ink-400">
            {selfEdit
              ? "Ask another admin to change your own role."
              : selectedRole?.hint}
          </span>
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
            This is their sign-in. Changing it signs them out.
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

      {editing && (
        <label className="block sm:max-w-sm">
          <span className="mb-1 block text-sm font-medium">Account status</span>
          <select
            value={form.status}
            onChange={set("status")}
            disabled={selfEdit}
            className={inputCls}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-ink-400">
            {selfEdit
              ? "You cannot suspend your own account."
              : selectedStatus?.hint}
          </span>
        </label>
      )}

      <label className="block sm:max-w-sm">
        <span className="mb-1 block text-sm font-medium">
          {editing ? "Reset password" : "Temporary password"}
          {editing && <span className="text-ink-400"> (optional)</span>}
        </span>
        <input
          type="text"
          required={!editing}
          minLength={8}
          value={form.password}
          onChange={set("password")}
          className={`${inputCls} font-mono`}
          autoComplete="new-password"
          placeholder={editing ? "Leave blank to keep the current one" : undefined}
        />
        <span className="mt-1 block text-xs text-ink-400">
          {editing
            ? "Setting a new password does not sign them out of open sessions."
            : "Share it with them privately — they can change it from their profile."}
        </span>
      </label>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {notice && (
        <p className="rounded-md border border-pine-100 bg-pine-50 px-3 py-2 text-sm text-pine-800">
          {notice}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-pine-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pine-700 active:translate-y-px disabled:opacity-60"
        >
          {busy ? "Saving…" : editing ? "Save changes" : "Create staff account"}
        </button>
        <Link
          href="/admin/staff"
          className="text-sm text-ink-600 underline underline-offset-4 hover:text-pine-800"
        >
          {editing ? "Back to staff" : "Cancel"}
        </Link>
      </div>
    </form>
  );
}

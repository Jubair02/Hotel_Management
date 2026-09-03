"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const inputCls =
  "w-full rounded-md border border-sand-300 bg-white px-3 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-pine-700/40 focus:border-pine-700";

function Notice({ kind, text }: { kind: "ok" | "error"; text: string }) {
  return (
    <p
      className={`rounded-md border px-3 py-2 text-sm ${
        kind === "ok"
          ? "border-pine-100 bg-pine-50 text-pine-800"
          : "border-red-100 bg-red-50 text-red-700"
      }`}
    >
      {text}
    </p>
  );
}

export function ProfileForm({
  initial,
}: {
  initial: { name: string; email: string; phone: string };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setNotice({ kind: "error", text: data?.error ?? "Could not save changes" });
        return;
      }
      setNotice({ kind: "ok", text: "Profile saved" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Full name</span>
        <input
          required
          minLength={2}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
          autoComplete="name"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Email</span>
        <input
          value={initial.email}
          disabled
          className={`${inputCls} bg-sand-50 text-ink-400`}
        />
        <span className="mt-1 block text-xs text-ink-400">
          Your email is your sign-in and can&apos;t be changed here.
        </span>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">
          Phone <span className="text-ink-400">(optional)</span>
        </span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputCls}
          autoComplete="tel"
          placeholder="+880…"
        />
      </label>

      {notice && <Notice kind={notice.kind} text={notice.text} />}

      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-pine-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pine-700 disabled:opacity-60"
      >
        {busy ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

export function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      setNotice({ kind: "error", text: "New passwords don't match" });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setNotice({ kind: "error", text: data?.error ?? "Could not change password" });
        return;
      }
      setNotice({ kind: "ok", text: "Password changed" });
      setCurrent("");
      setNext("");
      setConfirm("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Current password</span>
        <input
          type="password"
          required
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className={inputCls}
          autoComplete="current-password"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">New password</span>
          <input
            type="password"
            required
            minLength={8}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className={inputCls}
            autoComplete="new-password"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Confirm new password</span>
          <input
            type="password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputCls}
            autoComplete="new-password"
          />
        </label>
      </div>

      {notice && <Notice kind={notice.kind} text={notice.text} />}

      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-pine-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pine-700 disabled:opacity-60"
      >
        {busy ? "Changing…" : "Change password"}
      </button>
    </form>
  );
}

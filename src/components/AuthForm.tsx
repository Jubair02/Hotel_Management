"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";
import { roleHome, safeNext } from "@/lib/roles";

const inputCls =
  "w-full rounded-md border border-sand-300 bg-white px-3 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-pine-700/40 focus:border-pine-700";

function AuthFormInner({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Open-redirect guard: only a same-site path survives; anything else is
  // dropped and the user lands on their role's home instead.
  const next = safeNext(searchParams.get("next"), "") || null;

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "login"
            ? { email: form.email, password: form.password }
            : form
        ),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong");
        return;
      }
      router.push(next ?? roleHome(data?.user?.role ?? ""));
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {mode === "register" && (
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Full name</span>
          <input
            required
            minLength={2}
            value={form.name}
            onChange={set("name")}
            className={inputCls}
            autoComplete="name"
          />
        </label>
      )}

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Email</span>
        <input
          type="email"
          required
          value={form.email}
          onChange={set("email")}
          className={inputCls}
          autoComplete="email"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Password</span>
        <input
          type="password"
          required
          minLength={mode === "register" ? 6 : 1}
          value={form.password}
          onChange={set("password")}
          className={inputCls}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      </label>

      {mode === "register" && (
        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            Phone <span className="text-ink-400">(optional)</span>
          </span>
          <input
            value={form.phone}
            onChange={set("phone")}
            className={inputCls}
            autoComplete="tel"
          />
        </label>
      )}

      {error && (
        <p className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-md bg-pine-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-pine-700 disabled:opacity-60"
      >
        {busy
          ? "One moment…"
          : mode === "login"
            ? "Sign in"
            : "Create account"}
      </button>

      <p className="text-center text-sm text-ink-600">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link
              href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`}
              className="font-medium text-pine-800 underline underline-offset-4"
            >
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already a guest?{" "}
            <Link
              href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}
              className="font-medium text-pine-800 underline underline-offset-4"
            >
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  return (
    <Suspense>
      <AuthFormInner mode={mode} />
    </Suspense>
  );
}

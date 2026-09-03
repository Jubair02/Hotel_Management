"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      disabled={busy}
      className="px-3 py-2 rounded-md text-sm text-ink-600 hover:text-pine-900 hover:bg-sand-100 disabled:opacity-50"
    >
      Sign out
    </button>
  );
}

import type { Role } from "@prisma/client";

/**
 * Only same-site paths may be used as a post-login destination. Anything
 * else (absolute URLs, protocol-relative "//evil.com", backslash tricks)
 * falls back — `?next=` is attacker-controlled and must never send a
 * freshly signed-in user off-site.
 */
export function safeNext(
  value: string | null | undefined,
  fallback: string
): string {
  if (!value) return fallback;
  if (!/^\/(?![\/\\])[^\\\s]*$/.test(value)) return fallback;
  return value;
}

/** Where each role lands after signing in — the single source of truth. */
export function roleHome(role: Role | string): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "RECEPTIONIST":
      return "/reception";
    case "HOUSEKEEPING":
      return "/housekeeping";
    default:
      return "/dashboard";
  }
}

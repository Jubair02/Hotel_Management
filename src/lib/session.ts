import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_DAYS,
  verifySession,
  type SessionPayload,
} from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Read the current session from the request cookies (server only). */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export type VerifiedSession =
  | { session: SessionPayload; revoked: false }
  /** No cookie / bad signature. */
  | { session: null; revoked: false }
  /** Token was valid but the account is gone or its role changed since. */
  | { session: null; revoked: true };

/**
 * Session + live database check. A JWT carries the role it was issued
 * with, so on its own it cannot notice that an admin demoted (or deleted)
 * the user during the token's 7-day life. Here the token is only honoured
 * while the account still exists with the SAME role — any change revokes
 * every outstanding token for that user and forces a fresh sign-in.
 */
export async function getVerifiedSession(): Promise<VerifiedSession> {
  const session = await getSession();
  if (!session) return { session: null, revoked: false };

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { role: true },
  });
  if (!user || user.role !== session.role) {
    return { session: null, revoked: true };
  }
  return { session, revoked: false };
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

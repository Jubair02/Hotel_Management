import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import type { SessionPayload } from "@/lib/auth";
import { clearSessionCookie, getVerifiedSession } from "@/lib/session";

type GuardResult =
  | { session: SessionPayload; error: null }
  | { session: null; error: NextResponse };

export const SESSION_REVOKED_MESSAGE =
  "Your access has changed — please sign in again";

/**
 * API-level RBAC guard. Frontend route protection alone is not enough —
 * every API handler verifies the JWT and the caller's role here.
 *
 * The token is checked against the database on every call: if the account
 * was deleted or its role changed since the token was issued, the request
 * gets a 401, the cookie is cleared, and the user has to sign in again.
 * That is how a role change (or "force logout") takes effect immediately
 * instead of when the 7-day JWT expires.
 */
export async function requireAuth(roles?: Role[]): Promise<GuardResult> {
  const { session, revoked } = await getVerifiedSession();
  if (!session) {
    if (revoked) await clearSessionCookie();
    return {
      session: null,
      error: NextResponse.json(
        revoked
          ? { error: SESSION_REVOKED_MESSAGE, code: "SESSION_REVOKED" }
          : { error: "Authentication required" },
        { status: 401 }
      ),
    };
  }
  if (roles && roles.length > 0 && !roles.includes(session.role)) {
    return {
      session: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { session, error: null };
}

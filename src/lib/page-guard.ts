import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import type { SessionPayload } from "@/lib/auth";
import { getVerifiedSession } from "@/lib/session";
import { roleHome } from "@/lib/roles";

/**
 * Page-level counterpart of requireAuth(), for the layout of each
 * signed-in section. Middleware already routes by the JWT's role at the
 * edge (where there is no database); this runs in the Node layout and
 * confirms the account still exists with that role. A stale token is sent
 * to the sign-in page with a notice instead of a page it no longer owns.
 */
export async function requirePageRole(roles: Role[]): Promise<SessionPayload> {
  const { session, revoked } = await getVerifiedSession();
  if (!session) redirect(revoked ? "/login?reason=session" : "/login");
  if (!roles.includes(session.role)) redirect(roleHome(session.role));
  return session;
}

import { NextResponse } from "next/server";
import { clearSessionCookie, getVerifiedSession } from "@/lib/session";

export async function GET() {
  const { session, revoked } = await getVerifiedSession();
  if (!session) {
    if (revoked) await clearSessionCookie();
    return NextResponse.json(
      revoked ? { user: null, code: "SESSION_REVOKED" } : { user: null },
      { status: 401 }
    );
  }
  return NextResponse.json({
    user: {
      id: session.sub,
      name: session.name,
      email: session.email,
      role: session.role,
    },
  });
}

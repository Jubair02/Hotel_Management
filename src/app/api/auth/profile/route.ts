import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/guard";
import { updateProfileSchema } from "@/lib/validation";
import { signSession } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";

/** PATCH /api/auth/profile — update the signed-in user's name/phone. */
export async function PATCH(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: session.sub },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
    },
  });

  // The session token carries the name — re-issue it so the navbar and
  // booking forms show the new name immediately.
  const token = await signSession({
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
  await setSessionCookie(token);

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
  });
}

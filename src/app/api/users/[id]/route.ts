import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/guard";
import { updateUserRoleSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/users/:id (ADMIN) — change a user's role.
 *
 * Guards:
 *  - an admin cannot change their own role (no locking yourself out);
 *  - the last remaining ADMIN cannot be demoted.
 *
 * Because requireAuth() reads the role from the database, the change
 * applies to the target's API access immediately. Their session cookie
 * still carries the old role for page routing until they sign in again.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateUserRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { role } = parsed.data;

  if (id === session.sub) {
    return NextResponse.json(
      { error: "You cannot change your own role" },
      { status: 409 }
    );
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (target.role === role) {
    return NextResponse.json(
      { error: `User is already ${role}` },
      { status: 409 }
    );
  }

  if (target.role === "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) {
      return NextResponse.json(
        { error: "Cannot demote the only admin" },
        { status: 409 }
      );
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, name: true, email: true, phone: true, role: true },
  });

  return NextResponse.json({ user });
}

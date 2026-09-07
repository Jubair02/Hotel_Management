import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/guard";
import { updateUserSchema } from "@/lib/validation";
import { PUBLIC_USER } from "@/lib/users";

type Params = { params: Promise<{ id: string }> };

/** GET /api/users/:id (ADMIN) — one account, without its password hash. */
export async function GET(_req: NextRequest, { params }: Params) {
  const { error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: PUBLIC_USER,
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({ user });
}

/**
 * PATCH /api/users/:id (ADMIN) — edit any account.
 *
 * Accepts any subset of { name, email, phone, role, status, password }, so
 * the inline role dropdown and the full edit form share one endpoint.
 *
 * Guards:
 *  - an admin cannot change their own role or status (no locking yourself out);
 *  - the last ACTIVE admin cannot be demoted or suspended;
 *  - an email already in use is refused rather than crashing on the unique index.
 *
 * Sessions: requireAuth() and the page guards compare the token against
 * the live row, so changing a role or email, or suspending the account,
 * signs that person out everywhere on their next request. The response
 * reports this as `signedOut` so the UI can say so.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { name, email, phone, role, status, password } = parsed.data;

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, phone: true, role: true, status: true },
  });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const isSelf = id === session.sub;
  if (isSelf && role && role !== target.role) {
    return NextResponse.json(
      { error: "You cannot change your own role — ask another admin" },
      { status: 409 }
    );
  }
  if (isSelf && status && status !== target.status) {
    return NextResponse.json(
      { error: "You cannot suspend your own account" },
      { status: 409 }
    );
  }

  // The house must always keep one admin who can actually sign in.
  const wasActiveAdmin = target.role === "ADMIN" && target.status === "ACTIVE";
  const staysActiveAdmin =
    (role ?? target.role) === "ADMIN" && (status ?? target.status) === "ACTIVE";
  if (wasActiveAdmin && !staysActiveAdmin) {
    const activeAdmins = await prisma.user.count({
      where: { role: "ADMIN", status: "ACTIVE" },
    });
    if (activeAdmins <= 1) {
      return NextResponse.json(
        { error: "This is the only active admin — promote another admin first" },
        { status: 409 }
      );
    }
  }

  if (email && email !== target.email) {
    const taken = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (taken) {
      return NextResponse.json(
        { error: "Another account already uses this email" },
        { status: 409 }
      );
    }
  }

  // Keep the inline dropdown's original contract: a role-only request that
  // changes nothing is a conflict, so a desynced list says so out loud.
  const roleOnly =
    !!body && typeof body === "object" && Object.keys(body).length === 1 && "role" in body;
  if (roleOnly && role === target.role) {
    return NextResponse.json({ error: `User is already ${role}` }, { status: 409 });
  }

  const data: Prisma.UserUpdateInput = {};
  if (name !== undefined && name !== target.name) data.name = name;
  if (email !== undefined && email !== target.email) data.email = email;
  if (phone !== undefined) {
    const next = phone || null;
    if (next !== target.phone) data.phone = next;
  }
  if (role !== undefined && role !== target.role) data.role = role;
  if (status !== undefined && status !== target.status) data.status = status;
  if (password) data.password = await bcrypt.hash(password, 10);

  if (Object.keys(data).length === 0) {
    const user = await prisma.user.findUnique({ where: { id }, select: PUBLIC_USER });
    return NextResponse.json({ user, changed: [], signedOut: false });
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: PUBLIC_USER,
  });

  const changed = Object.keys(data);
  return NextResponse.json({
    user,
    changed,
    // Password changes do not revoke a token (there is no token version in
    // the MVP); identity and access changes do.
    signedOut: !isSelf && ["role", "email", "status"].some((k) => changed.includes(k)),
  });
}

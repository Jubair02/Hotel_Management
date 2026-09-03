import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/guard";
import { createStaffSchema, roleValues } from "@/lib/validation";

const PUBLIC_USER = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

/**
 * GET /api/users (ADMIN) — list accounts.
 *   ?role=RECEPTIONIST   filter by role
 *   ?q=rafiq             search name / email
 * Passwords are never returned.
 */
export async function GET(req: NextRequest) {
  const { error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const roleParam = searchParams.get("role");
  const role = roleParam ? roleValues.find((r) => r === roleParam) : undefined;
  if (roleParam && !role) {
    return NextResponse.json(
      { error: `Invalid role: expected one of ${roleValues.join(", ")}` },
      { status: 400 }
    );
  }
  const q = searchParams.get("q")?.trim();

  const users = await prisma.user.findMany({
    where: {
      ...(role ? { role } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: PUBLIC_USER,
    orderBy: [{ role: "asc" }, { name: "asc" }],
    take: 200,
  });

  return NextResponse.json({ users });
}

/**
 * POST /api/users (ADMIN) — create a staff account with an explicit role.
 * Public registration (/api/auth/register) is the only other way to create
 * an account and it always produces a GUEST.
 */
export async function POST(req: NextRequest) {
  const { error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = createStaffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, email, password, phone, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      {
        error:
          "An account with this email already exists — change its role from the staff list instead",
      },
      { status: 409 }
    );
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: await bcrypt.hash(password, 10),
      phone: phone || null,
      role,
    },
    select: PUBLIC_USER,
  });

  return NextResponse.json({ user }, { status: 201 });
}

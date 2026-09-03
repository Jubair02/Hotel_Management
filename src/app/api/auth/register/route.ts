import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validation";
import { signSession } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";
import {
  checkLimit,
  clientIp,
  recordAttempt,
  retryMessage,
} from "@/lib/rate-limit";

// Account creation is throttled per IP so the sign-up form cannot be used
// to spam the users table or probe which emails exist.
const REGISTER_LIMIT = 10;
const REGISTER_WINDOW_MS = 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const ipKey = `register:ip:${clientIp(req)}`;
  const status = checkLimit(ipKey, REGISTER_LIMIT);
  if (status.limited) {
    return NextResponse.json(
      { error: retryMessage(status.retryAfterSec), code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(status.retryAfterSec) } }
    );
  }
  recordAttempt(ipKey, REGISTER_WINDOW_MS);

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, email, password, phone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: await bcrypt.hash(password, 10),
      phone: phone || null,
      // Public registration always creates a GUEST — staff roles are
      // assigned by an admin, never self-selected.
      role: "GUEST",
    },
  });

  const token = await signSession({
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
  await setSessionCookie(token);

  return NextResponse.json(
    { user: { id: user.id, name: user.name, email: user.email, role: user.role } },
    { status: 201 }
  );
}

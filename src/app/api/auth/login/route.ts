import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validation";
import { signSession } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";
import {
  checkLimit,
  clientIp,
  recordAttempt,
  resetLimit,
  retryMessage,
} from "@/lib/rate-limit";

/**
 * Throttling: failed attempts are counted per account AND per client IP.
 *  - 5 failures for one email in 15 minutes locks that email out (from any
 *    IP) until the window passes — stops a targeted guess.
 *  - 30 failures from one IP in 15 minutes blocks the IP — stops spraying
 *    one password across many accounts.
 * A successful sign-in clears the account's counter.
 */
const WINDOW_MS = 15 * 60 * 1000;
const EMAIL_LIMIT = 5;
const IP_LIMIT = 30;

function tooMany(retryAfterSec: number) {
  return NextResponse.json(
    { error: retryMessage(retryAfterSec), code: "RATE_LIMITED" },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase();
  const { password } = parsed.data;
  const ipKey = `login:ip:${clientIp(req)}`;
  const emailKey = `login:email:${email}`;

  const ipStatus = checkLimit(ipKey, IP_LIMIT);
  if (ipStatus.limited) return tooMany(ipStatus.retryAfterSec);
  const emailStatus = checkLimit(emailKey, EMAIL_LIMIT);
  if (emailStatus.limited) return tooMany(emailStatus.retryAfterSec);

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = user && (await bcrypt.compare(password, user.password));

  if (!valid) {
    recordAttempt(ipKey, WINDOW_MS);
    recordAttempt(emailKey, WINDOW_MS);
    const after = checkLimit(emailKey, EMAIL_LIMIT);
    return NextResponse.json(
      {
        error:
          after.remaining > 0 && after.remaining <= 2
            ? `Invalid email or password. ${after.remaining} attempt${after.remaining === 1 ? "" : "s"} left before a 15-minute lockout.`
            : "Invalid email or password",
      },
      { status: 401 }
    );
  }

  resetLimit(emailKey);

  const token = await signSession({
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
  await setSessionCookie(token);

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

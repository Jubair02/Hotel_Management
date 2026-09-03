import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  phone: z.string().min(6).max(20).optional().or(z.literal("")),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const availabilityQuerySchema = z.object({
  checkIn: dateOnly,
  checkOut: dateOnly,
  guests: z.coerce.number().int().min(1).max(20).default(1),
});

export const createBookingSchema = z.object({
  roomId: z.string().min(1),
  checkIn: dateOnly,
  checkOut: dateOnly,
  numberOfGuests: z.coerce.number().int().min(1).max(20),
  guestName: z.string().min(2).max(100),
  guestEmail: z.string().email(),
  guestPhone: z.string().min(6).max(20),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export const roomTypeValues = [
  "SINGLE",
  "DOUBLE",
  "TWIN",
  "DELUXE",
  "SUITE",
  "FAMILY",
] as const;

export const roomStatusValues = [
  "AVAILABLE",
  "OCCUPIED",
  "RESERVED",
  "CLEANING",
  "MAINTENANCE",
] as const;

export const roomSchema = z.object({
  roomNumber: z.string().min(1).max(10),
  name: z.string().min(2).max(100),
  type: z.enum(roomTypeValues),
  description: z.string().min(10).max(2000),
  pricePerNight: z.coerce.number().positive().max(1_000_000),
  capacity: z.coerce.number().int().min(1).max(20),
  status: z.enum(roomStatusValues).default("AVAILABLE"),
  images: z.array(z.string().url()).max(10).default([]),
  amenities: z.array(z.string().min(1).max(50)).max(30).default([]),
});

export const updateRoomSchema = roomSchema.partial();

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().min(6).max(20).optional().or(z.literal("")),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(6, "New password must be at least 6 characters")
    .max(100),
});

export const payBookingSchema = z.object({
  provider: z.enum(["CASH", "MOCK", "SSLCOMMERZ", "BKASH"]),
});

export const staffRoleValues = ["ADMIN", "RECEPTIONIST", "HOUSEKEEPING"] as const;
export const roleValues = ["ADMIN", "GUEST", "RECEPTIONIST", "HOUSEKEEPING"] as const;

/** Admin creates a staff account — role is chosen explicitly, never GUEST. */
export const createStaffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  phone: z.string().min(6).max(20).optional().or(z.literal("")),
  role: z.enum(staffRoleValues, { message: "Choose a staff role" }),
});

/** Admin changes any user's role (promote a guest, demote a staffer). */
export const updateUserRoleSchema = z.object({
  role: z.enum(roleValues, { message: "Invalid role" }),
});

export const bookingStatusValues = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "CHECKED_IN",
  "CHECKED_OUT",
] as const;

export const taskStatusValues = [
  "PENDING",
  "IN_PROGRESS",
  "DONE",
  "MAINTENANCE_REPORTED",
] as const;

/* ---------- List-endpoint query strings ----------
 * Query params are user input too: an unknown enum value or a malformed
 * date must be a 400, never a Prisma exception. Every field is optional. */

const emptyToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

export const roomListQuerySchema = z.object({
  type: z.preprocess(emptyToUndefined, z.enum(roomTypeValues).optional()),
  status: z.preprocess(emptyToUndefined, z.enum(roomStatusValues).optional()),
});

export const bookingListQuerySchema = z.object({
  status: z.preprocess(emptyToUndefined, z.enum(bookingStatusValues).optional()),
  guestName: z.preprocess(emptyToUndefined, z.string().max(100).optional()),
  date: z.preprocess(emptyToUndefined, dateOnly.optional()),
});

export const taskListQuerySchema = z.object({
  status: z.preprocess(emptyToUndefined, z.enum(taskStatusValues).optional()),
});

/** Pull the named keys out of a URLSearchParams as a plain object. */
export function pickQuery<K extends string>(
  params: URLSearchParams,
  keys: readonly K[]
): Record<K, string | null> {
  return Object.fromEntries(keys.map((k) => [k, params.get(k)])) as Record<
    K,
    string | null
  >;
}

/** "status: Invalid enum value…" — the first issue, prefixed with its param. */
export function queryErrorMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid query";
  const path = issue.path.join(".");
  return path ? `Invalid ${path}: ${issue.message}` : issue.message;
}

import type { Prisma } from "@prisma/client";

/** The only user shape that ever leaves the API — never the password hash. */
export const PUBLIC_USER = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  RECEPTIONIST: "Receptionist",
  HOUSEKEEPING: "Housekeeping",
  GUEST: "Guest",
};

export const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
};

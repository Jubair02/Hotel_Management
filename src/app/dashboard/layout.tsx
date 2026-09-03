import { requirePageRole } from "@/lib/page-guard";

/** Every role may open /dashboard/profile; the account just has to be live. */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageRole(["ADMIN", "GUEST", "RECEPTIONIST", "HOUSEKEEPING"]);
  return <>{children}</>;
}

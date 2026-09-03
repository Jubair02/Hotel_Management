import { requirePageRole } from "@/lib/page-guard";

export default async function HousekeepingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageRole(["ADMIN", "HOUSEKEEPING"]);
  return <>{children}</>;
}

import { requirePageRole } from "@/lib/page-guard";

export default async function ReceptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageRole(["ADMIN", "RECEPTIONIST"]);
  return <>{children}</>;
}

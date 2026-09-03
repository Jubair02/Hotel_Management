import { requirePageRole } from "@/lib/page-guard";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageRole(["ADMIN"]);
  return <>{children}</>;
}

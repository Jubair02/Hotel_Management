import { SectionNav, ADMIN_NAV } from "@/components/SectionNav";
import { RoomForm } from "@/components/RoomForm";

export const metadata = { title: "Add room · Admin" };

export default function NewRoomPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
        Admin
      </p>
      <h1 className="mt-1 font-display text-3xl text-pine-900">Add a room</h1>
      <SectionNav items={ADMIN_NAV} active="/admin/rooms" />
      <div className="mt-8 rounded-xl border border-sand-200 bg-white p-6">
        <RoomForm />
      </div>
    </div>
  );
}

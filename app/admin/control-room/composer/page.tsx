/** Broadcast composer entry: same shell gate; client bundle loads drafts/queue from summary API. */
import { Card } from "@/components/ui/card";
import { AdminAccessDialog } from "@/components/admin/AdminAccessDialog";
import { ControlRoomComposerClient } from "@/components/admin/ControlRoomComposerClient";
import { getAdminShellGate } from "@/lib/admin-shell-gate";

export default async function ControlRoomComposerPage() {
  const shell = await getAdminShellGate();

  if (shell.state === "missing-env") {
    return (
      <section className="mx-auto w-full max-w-9xl px-4 py-10 sm:px-8">
        <Card className="glass-panel border-amber-300/30 bg-amber-500/10 p-6 text-amber-100">
          Set `ADMIN_DASHBOARD_KEY` in `.env` to enable the admin control room.
        </Card>
      </section>
    );
  }

  if (shell.state === "unauthenticated") {
    return <AdminAccessDialog />;
  }

  return (
    <section className="mx-auto w-full max-w-9xl px-4 py-6 sm:px-8">
      <ControlRoomComposerClient />
    </section>
  );
}

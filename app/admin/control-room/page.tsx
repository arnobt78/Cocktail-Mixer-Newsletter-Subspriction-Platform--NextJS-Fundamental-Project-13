/**
 * Control room home: fast shell gate → passkey vs Suspense-wrapped overview (Redis summary inside).
 */
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { AdminAccessDialog } from "@/components/admin/AdminAccessDialog";
import { AdminOverviewPageSkeleton } from "@/components/admin/admin-control-room-skeletons";
import { ControlRoomOverviewContent } from "@/components/admin/control-room-async-segments";
import { getAdminShellGate } from "@/lib/admin-shell-gate";

export default async function ControlRoomPage() {
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
    <Suspense fallback={<AdminOverviewPageSkeleton />}>
      <ControlRoomOverviewContent />
    </Suspense>
  );
}

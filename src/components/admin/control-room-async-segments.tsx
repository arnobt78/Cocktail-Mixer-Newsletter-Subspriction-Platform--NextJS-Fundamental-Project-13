/**
 * RSC segments for control-room pages: branch on env missing → unauthenticated → passkey dialog → data views.
 */
import { Card } from "@/components/ui/card";
import { AdminAccessDialog } from "@/components/admin/AdminAccessDialog";
import { AdminOverviewDashboard } from "@/components/admin/AdminOverviewDashboard";
import { SubscribersAdminPanel } from "@/components/admin/SubscribersAdminPanel";
import { getAdminDashboardGate } from "@/lib/admin-dashboard-server";
import { getAdminShellGate } from "@/lib/admin-shell-gate";
import {
  listAllSubscribers,
  listPendingSubscribers,
} from "@/lib/newsletter/repository";

export async function ControlRoomOverviewContent() {
  const gate = await getAdminDashboardGate();
  if (gate.state === "missing-env") {
    return (
      <section className="mx-auto w-full max-w-9xl px-4 py-10 sm:px-8">
        <Card className="glass-panel border-amber-300/30 bg-amber-500/10 p-6 text-amber-100">
          Set `ADMIN_DASHBOARD_KEY` in `.env` to enable the admin control room.
        </Card>
      </section>
    );
  }
  if (gate.state === "unauthenticated") {
    return <AdminAccessDialog />;
  }
  return (
    <AdminOverviewDashboard
      initialSummary={gate.summary}
      fromEmail={gate.fromEmail}
      replyToEmail={gate.replyToEmail}
    />
  );
}

export async function ControlRoomSubscribersContent() {
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
  const [subscribers, pending] = await Promise.all([
    listAllSubscribers(),
    listPendingSubscribers(),
  ]);
  return (
    <SubscribersAdminPanel initialSubscribers={subscribers} initialPending={pending} />
  );
}

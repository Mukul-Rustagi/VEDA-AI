import { DashboardShell } from "@/components/layout/dashboard-shell";
import { GroupsDashboard } from "@/components/groups/groups-dashboard";
import { SocketBridge } from "@/components/layout/socket-bridge";

export default function GroupsPage(): JSX.Element {
  return (
    <DashboardShell pageTitle="My Groups">
      <SocketBridge />
      <GroupsDashboard />
    </DashboardShell>
  );
}

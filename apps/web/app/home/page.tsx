import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SocketBridge } from "@/components/layout/socket-bridge";
import { HomeDashboard } from "@/components/home/home-dashboard";

export default function HomePage(): JSX.Element {
  return (
    <DashboardShell pageTitle="Home">
      <SocketBridge />
      <HomeDashboard />
    </DashboardShell>
  );
}

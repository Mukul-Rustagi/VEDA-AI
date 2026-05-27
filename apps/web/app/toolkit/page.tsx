import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ToolkitDashboard } from "@/components/toolkit/toolkit-dashboard";

export default function ToolkitPage(): JSX.Element {
  return (
    <DashboardShell pageTitle="AI Teacher's Toolkit">
      <ToolkitDashboard />
    </DashboardShell>
  );
}

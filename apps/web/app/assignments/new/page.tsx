import { AssignmentForm } from "@/components/assignments/assignment-form";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function NewAssignmentPage(): JSX.Element {
  return (
    <DashboardShell pageTitle="Create Assignment">
      <AssignmentForm />
    </DashboardShell>
  );
}

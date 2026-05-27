import { DashboardShell } from "@/components/layout/dashboard-shell";
import { FeaturePage } from "@/components/layout/feature-page";

export default function LibraryPage(): JSX.Element {
  return (
    <DashboardShell pageTitle="My Library">
      <FeaturePage
        title="My Library"
        subtitle="Saved resources and reusable material."
        description="Upload and organize reusable teaching assets and question banks in this area."
      />
    </DashboardShell>
  );
}

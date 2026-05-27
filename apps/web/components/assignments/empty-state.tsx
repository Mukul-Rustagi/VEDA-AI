import { Plus, Search } from "lucide-react";
import Link from "next/link";

export function EmptyAssignmentState(): JSX.Element {
  return (
    <section className="emptyState">
      <div className="emptyIllustration" aria-hidden="true">
        <div className="illustrationHalo" />
        <div className="illustrationPaper">
          <div className="paperLine dark" />
          <div className="paperLine" />
          <div className="paperLine" />
        </div>
        <div className="illustrationLens">
          <Search size={34} />
          <div className="lensX">×</div>
        </div>
        <div className="illustrationSpark one" />
        <div className="illustrationSpark two" />
      </div>
      <h2>No assignments yet</h2>
      <p>
        Create your first assignment to start collecting and grading student submissions.
        You can set up rubrics, define marking criteria, and let AI assist with grading.
      </p>
      <Link className="primaryAction compact" href="/assignments/new">
        <Plus size={14} />
        Create Your First Assignment
      </Link>
    </section>
  );
}

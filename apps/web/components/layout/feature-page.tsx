import Link from "next/link";

interface FeaturePageProps {
  title: string;
  subtitle: string;
  description: string;
}

export function FeaturePage({
  title,
  subtitle,
  description
}: FeaturePageProps): JSX.Element {
  return (
    <section className="panelSection">
      <header className="panelHeading">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </header>

      <div className="emptyState">
        <h2>{title}</h2>
        <p>{description}</p>
        <Link className="primaryAction compact" href="/assignments">
          Go to Assignments
        </Link>
      </div>
    </section>
  );
}

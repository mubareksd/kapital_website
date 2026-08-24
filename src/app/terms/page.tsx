import Link from "next/link";

export const metadata = {
  title: "Terms · Kapital",
  description: "Terms for the temporary Kapital site.",
};

export default function TermsPage() {
  return (
    <main className="legal-page">
      <header className="site-header">
        <div className="container nav">
          <Link className="brand" href="/">
            Kapital
          </Link>
          <nav className="nav-links" aria-label="Primary">
            <Link href="/">Home</Link>
            <Link href="/privacy">Privacy</Link>
          </nav>
        </div>
      </header>

      <section className="legal-main">
        <article className="legal-card">
          <p className="section-label">Terms</p>
          <h1>Terms of use</h1>
          <p>
            This temporary Kapital site is informational. It does not provide
            live trading, custody, or exchange services.
          </p>

          <h2>The service</h2>
          <p>
            Kapital is preparing a retail platform related to Ethiopian
            Securities Exchange market access. During this temporary phase, the
            site exists only to present the brand and share contact details.
          </p>

          <h2>No investment advice</h2>
          <p>
            Nothing on this temporary site should be treated as investment,
            legal, or financial advice.
          </p>

          <h2>Changes</h2>
          <p>
            We may update this site and these terms as the platform rollout
            evolves.
          </p>

          <h2>Contact</h2>
          <p>
            For questions, contact
            <a href="mailto:support@kinet.et"> support@kinet.et</a>.
          </p>
        </article>
      </section>
    </main>
  );
}

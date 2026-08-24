import Link from "next/link";

export const metadata = {
  title: "Privacy · Kapital",
  description: "Privacy information for the temporary Kapital site.",
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <header className="site-header">
        <div className="container nav">
          <Link className="brand" href="/">
            Kapital
          </Link>
          <nav className="nav-links" aria-label="Primary">
            <Link href="/">Home</Link>
            <Link href="/terms">Terms</Link>
          </nav>
        </div>
      </header>

      <section className="legal-main">
        <article className="legal-card">
          <p className="section-label">Privacy</p>
          <h1>Privacy policy</h1>
          <p>
            This temporary Kapital site is operated by Kinet Systems to present
            the platform while the full service is being prepared.
          </p>

          <h2>What we collect</h2>
          <ul>
            <li>Basic visit and server log information needed to run the site.</li>
            <li>
              Information you choose to send us by email if you contact
              <a href="mailto:support@kinet.et"> support@kinet.et</a>.
            </li>
          </ul>

          <h2>How we use it</h2>
          <p>
            We use this information to respond to launch inquiries, maintain the
            website, and prepare the Kapital rollout. We do not sell visitor
            information.
          </p>

          <h2>Contact</h2>
          <p>
            If you have questions about this page, contact
            <a href="mailto:support@kinet.et"> support@kinet.et</a>.
          </p>
        </article>
      </section>
    </main>
  );
}

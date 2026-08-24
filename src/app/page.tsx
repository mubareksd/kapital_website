import Link from "next/link";

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <div className="container nav">
          <Link className="brand" href="/">
            Kapital
          </Link>
          <nav className="nav-links" aria-label="Primary">
            <a href="#about">About</a>
            <a href="#features">Features</a>
            <a href="#launch">Launch</a>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">Retail ESX access</p>
            <h1>Trade ESX from your phone with Kapital.</h1>
            <p className="lead">
              Kapital is a mobile-first retail trading platform for the Ethiopian
              Securities Exchange. We are preparing market data, orders, wallet
              funding, and portfolio tools in one simple app.
            </p>
            <div className="cta-row">
              <a className="button button-primary" href="mailto:support@kinet.et?subject=Kapital%20launch%20interest">
                Contact us
              </a>
              <a className="button button-secondary" href="#launch">
                Launch details
              </a>
            </div>
            <p className="subtle">
              Temporary site for <strong>kapital.et</strong> while the full platform
              is being completed.
            </p>
          </div>

          <div className="hero-card" aria-label="Kapital preview">
            <div className="hero-card-top">
              <span className="live-dot" />
              <span>Kapital preview</span>
            </div>
            <div className="metric-row">
              <div>
                <p className="metric-label">Market</p>
                <p className="metric-value">ESX</p>
              </div>
              <div>
                <p className="metric-label">Focus</p>
                <p className="metric-value">Retail trading</p>
              </div>
            </div>
            <div className="hero-art" aria-hidden="true">
              <img
                src="/images/site/hero-app.svg"
                alt=""
                width={260}
                height={520}
                decoding="async"
                loading="eager"
              />
            </div>
            <ul className="hero-points">
              <li>Phone number sign-in with one-time code</li>
              <li>Live market board and charts</li>
              <li>Orders, holdings, and wallet flows</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="about" className="section">
        <div className="container two-up">
          <div>
            <p className="section-label">About Kapital</p>
            <h2>A simple public front door while the platform is in rollout.</h2>
          </div>
          <div className="copy-stack">
            <p>
              Kapital is being built to give retail investors one place to follow
              Ethiopian Securities Exchange prices, fund their account, submit
              orders, and monitor their portfolio.
            </p>
            <p>
              This temporary site keeps the brand live at <strong>kapital.et</strong>
              and gives users a clear place to learn what is coming and how to
              reach the team during rollout.
            </p>
          </div>
        </div>
      </section>

      <section id="features" className="section section-muted">
        <div className="container">
          <p className="section-label">Planned platform features</p>
          <div className="feature-grid">
            <article className="feature-card">
              <img
                className="feature-icon"
                src="/images/site/icon-market.svg"
                alt=""
                width={44}
                height={44}
                decoding="async"
              />
              <h3>Market board</h3>
              <p>Live ESX prices, movers, and symbol-level market data.</p>
            </article>
            <article className="feature-card">
              <img
                className="feature-icon"
                src="/images/site/icon-chart.svg"
                alt=""
                width={44}
                height={44}
                decoding="async"
              />
              <h3>Charts</h3>
              <p>Daily price history, short-term ranges, and simple comparisons.</p>
            </article>
            <article className="feature-card">
              <img
                className="feature-icon"
                src="/images/site/icon-trade.svg"
                alt=""
                width={44}
                height={44}
                decoding="async"
              />
              <h3>Trading</h3>
              <p>Retail order entry with pre-trade checks and broker routing.</p>
            </article>
            <article className="feature-card">
              <img
                className="feature-icon"
                src="/images/site/icon-wallet.svg"
                alt=""
                width={44}
                height={44}
                decoding="async"
              />
              <h3>Wallet</h3>
              <p>Deposits, withdrawals, and transaction visibility in one place.</p>
            </article>
            <article className="feature-card">
              <img
                className="feature-icon"
                src="/images/site/icon-portfolio.svg"
                alt=""
                width={44}
                height={44}
                decoding="async"
              />
              <h3>Portfolio</h3>
              <p>Holdings, balances, and working-order status after each session.</p>
            </article>
            <article className="feature-card">
              <h3>Mobile first</h3>
              <p>Designed for fast access on everyday Android and iPhone devices.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p className="section-label">A quick look</p>
          <div className="showcase-grid">
            <article className="showcase-card">
              <img
                src="/images/site/screen-board.svg"
                alt=""
                width={420}
                height={280}
                decoding="async"
                loading="lazy"
              />
              <h3>Market board</h3>
              <p>View prices, search symbols, and track the movers.</p>
            </article>
            <article className="showcase-card">
              <img
                src="/images/site/screen-chart.svg"
                alt=""
                width={420}
                height={280}
                decoding="async"
                loading="lazy"
              />
              <h3>Charts</h3>
              <p>Range filters, period highs/lows, and simple comparisons.</p>
            </article>
            <article className="showcase-card">
              <img
                src="/images/site/screen-portfolio.svg"
                alt=""
                width={420}
                height={280}
                decoding="async"
                loading="lazy"
              />
              <h3>Portfolio</h3>
              <p>Holdings and working order status after each session.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="launch" className="section">
        <div className="container launch-card">
          <div>
            <p className="section-label">Launch status</p>
            <h2>We are preparing the first public version.</h2>
            <p>
              If you want early access, partnership details, or rollout updates,
              contact the Kapital team directly.
            </p>
          </div>
          <div className="launch-actions">
            <a className="button button-primary" href="mailto:support@kinet.et">
              support@kinet.et
            </a>
            <p className="subtle">
              Operated by Kinet Systems. Kapital is not the exchange.
            </p>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <p className="brand footer-brand">Kapital</p>
            <p className="subtle">
              Temporary site for the upcoming retail ESX platform.
            </p>
          </div>
          <div className="footer-links">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <a href="mailto:support@kinet.et">support@kinet.et</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

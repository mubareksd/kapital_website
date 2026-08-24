import Link from "next/link";
import { MarketPanel } from "@/components/MarketPanel";
import { peekTickerSnapshot } from "@/lib/marlin/market";

export const dynamic = "force-dynamic";

export default async function Home() {
  const ticker = peekTickerSnapshot();
  const initialSymbol =
    ticker?.equities[0]?.symbol || ticker?.bonds[0]?.symbol || "";

  return (
    <main>
      <section className="hero">
        <div
          className="hero-media"
          style={{ backgroundImage: "url(/images/site/hero-bg.jpg)" }}
          aria-hidden="true"
        />
        <div className="hero-shade" aria-hidden="true" />
        <div className="container hero-stage">
          <div className="hero-copy">
            <p className="hero-brand">Kapital</p>
            <h1>Trade ESX from your phone.</h1>
            <p className="lead">
              Live Ethiopian Securities Exchange quotes, tickets, cash, and
              holdings, signed in with your mobile number.
            </p>
            <div className="cta-row">
              <a className="button button-primary" href="#board">
                Open the board
              </a>
              <a className="button button-secondary" href="#charts">
                Price charts
              </a>
            </div>
          </div>
        </div>
      </section>

      <MarketPanel initialSymbol={initialSymbol} />

      <section id="about" className="section">
        <div className="container about-block">
          <h2>Retail ESX access, built for Ethiopia.</h2>
          <p>
            Kapital gives investors one place to follow prices, fund an account,
            place orders, and watch holdings. This site at{" "}
            <strong>kapital.et</strong> stays live while the full app rolls out.
          </p>
        </div>
      </section>

      <section id="launch" className="section section-launch">
        <div className="container launch-row">
          <div>
            <h2>Preparing the first public version.</h2>
            <p>
              Early access, partnerships, or rollout questions: write the team
              directly.
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
          <p className="brand footer-brand">Kapital</p>
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

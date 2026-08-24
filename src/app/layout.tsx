import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Sora } from "next/font/google";
import { MarketDataProvider } from "@/components/MarketDataProvider";
import { SiteMast } from "@/components/SiteMast";
import { loadTickerSnapshot } from "@/lib/marlin/market";
import "./globals.css";

const sans = Sora({
  variable: "--font-sans",
  subsets: ["latin"],
});

const serif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kapital.et"),
  title: "Kapital · Trade ESX from your phone",
  description:
    "Kapital is preparing retail access to Ethiopian Securities Exchange market data, orders, and portfolio tools in one mobile-first platform.",
  applicationName: "Kapital",
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Kapital · Trade ESX from your phone",
    description:
      "A simple temporary site for Kapital while the retail trading platform is being prepared.",
    url: "https://kapital.et",
    siteName: "Kapital",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kapital · Trade ESX from your phone",
    description:
      "Kapital is preparing retail access to Ethiopian Securities Exchange market data, orders, and portfolio tools.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0D5C4D",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const ticker = await loadTickerSnapshot();

  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <MarketDataProvider initial={ticker}>
          <SiteMast />
          {children}
        </MarketDataProvider>
      </body>
    </html>
  );
}

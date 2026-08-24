"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { MarketTape } from "@/components/MarketTape";

type SiteMastProps = {
  links?: Array<{ href: string; label: string }>;
};

const defaultLinks = [
  { href: "/#board", label: "Board" },
  { href: "/#charts", label: "Charts" },
  { href: "/#about", label: "About" },
  { href: "/#features", label: "Features" },
  { href: "/#launch", label: "Launch" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function SiteMast({ links = defaultLinks }: SiteMastProps) {
  const mastRef = useRef<HTMLElement | null>(null);
  const spacerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mast = mastRef.current;
    const spacer = spacerRef.current;
    if (!mast || !spacer) return;

    const sync = () => {
      const height = Math.ceil(mast.getBoundingClientRect().height);
      spacer.style.height = `${height}px`;
      document.documentElement.style.setProperty("--mast-offset", `${height}px`);
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(mast);
    window.addEventListener("resize", sync);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, []);

  return (
    <>
      <header className="mast" ref={mastRef}>
        <MarketTape />
        <div className="site-header">
          <div className="container nav">
            <Link className="brand" href="/">
              Kapital
            </Link>
            <nav className="nav-links" aria-label="Primary">
              {links.map((link) =>
                link.href.startsWith("/#") || link.href.startsWith("#") ? (
                  <a key={link.href} href={link.href}>
                    {link.label}
                  </a>
                ) : (
                  <Link key={link.href} href={link.href}>
                    {link.label}
                  </Link>
                ),
              )}
            </nav>
          </div>
        </div>
      </header>
      <div className="mast-spacer" ref={spacerRef} aria-hidden="true" />
    </>
  );
}

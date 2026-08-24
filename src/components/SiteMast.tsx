"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { MarketTape } from "@/components/MarketTape";

type SiteMastProps = {
  links?: Array<{ href: string; label: string }>;
};

const defaultLinks = [
  { href: "/#activity", label: "Activity" },
  { href: "/#board", label: "Board" },
  { href: "/#charts", label: "Charts" },
  { href: "/#about", label: "About" },
  { href: "/#launch", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function SiteMast({ links = defaultLinks }: SiteMastProps) {
  const mastRef = useRef<HTMLElement | null>(null);
  const spacerRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

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
  }, [menuOpen]);

  useEffect(() => {
    const close = () => setMenuOpen(false);
    window.addEventListener("hashchange", close);
    return () => window.removeEventListener("hashchange", close);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <>
      <header className={`mast${menuOpen ? " is-menu-open" : ""}`} ref={mastRef}>
        <MarketTape />
        <div className="site-header">
          <div className="container nav">
            <Link className="brand" href="/" onClick={() => setMenuOpen(false)}>
              Kapital
            </Link>
            <button
              type="button"
              className="nav-toggle"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="nav-toggle-bars" aria-hidden="true" />
              <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
            </button>
            <nav
              id={menuId}
              className={`nav-links${menuOpen ? " is-open" : ""}`}
              aria-label="Primary"
            >
              {links.map((link) =>
                link.href.startsWith("/#") || link.href.startsWith("#") ? (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                  >
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

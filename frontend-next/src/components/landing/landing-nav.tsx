"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NAV_LINKS } from "@/lib/landing-data";
import { cn } from "@/lib/utils";

/**
 * LandingNav — the sticky top navigation for the marketing page. It sits
 * transparent over the hero and, once the page scrolls, settles into a
 * translucent, blurred bar with a hairline underline so the content beneath
 * stays legible. No color, no drawer — just a calm, steady header.
 */
export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors duration-300",
        scrolled
          ? "border-b border-border bg-background/80 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 md:px-16">
        {/* Brand */}
        <Link href="/welcome" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lifeos-logo.svg" alt="" className="h-7 w-auto" />
          <span className="text-lg font-semibold tracking-tight">LifeOS</span>
        </Link>

        {/* Center links */}
        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Button
            render={<Link href="/login" />}
            nativeButton={false}
            variant="ghost"
            size="sm"
            className="pill-cta hidden sm:inline-flex"
          >
            Sign in
          </Button>
          <Button
            render={<Link href="/register" />}
            nativeButton={false}
            size="sm"
            className="pill-cta"
          >
            Get started
          </Button>
        </div>
      </nav>
    </header>
  );
}

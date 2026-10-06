import Link from "next/link";

import { CreditsBadge } from "@/features/credits";
import { Wordmark } from "@/shared/ui";

import { NavLinks } from "./NavLinks";

/**
 * The app's header: brand, sections and the credit balance (ADR-028). Features never import each
 * other, so the header composes them here. On phones the sections move to the tab bar.
 */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/75 backdrop-blur-xl backdrop-saturate-150">
      <a
        href="#main"
        className="sr-only rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-50"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-8 px-4 sm:px-6">
        <Link
          href="/"
          aria-label="Citrus Talent Studio, home"
          className="rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background focus-visible:outline-none"
        >
          <Wordmark />
        </Link>
        <NavLinks className="hidden md:block" />
        <div className="ml-auto flex items-center gap-3">
          <CreditsBadge />
        </div>
      </div>
    </header>
  );
}

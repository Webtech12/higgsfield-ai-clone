import Link from "next/link";

import { Wordmark } from "@/shared/ui";

/** A quiet footer. On phones it keeps clear of the tab bar that floats over the page. */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border pb-20 md:pb-0">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <Wordmark />
          <p className="text-sm text-muted-foreground">
            Real talent with signed releases. AI-made ads, ready to post.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex gap-6 text-sm text-muted-foreground">
            <li>
              <Link href="/talent" className="transition-colors hover:text-foreground">
                The roster
              </Link>
            </li>
            <li>
              <Link href="/demo" className="transition-colors hover:text-foreground">
                Examples
              </Link>
            </li>
            <li>
              <Link href="/ads" className="transition-colors hover:text-foreground">
                My ads
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}

import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * A page's opening: a small eyebrow, a big Epilogue title, a line of context and the page's main
 * action. The title is the page's one h1.
 */
export function PageHeader({
  eyebrow,
  title,
  lede,
  actions,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn("flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between", className)}
    >
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="animate-rise text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1
          className="mt-3 animate-rise font-display text-5xl leading-[0.95] font-semibold tracking-[-0.035em] sm:text-6xl"
          style={{ animationDelay: "80ms" }}
        >
          {title}
        </h1>
        {lede ? (
          <p
            className="mt-4 max-w-2xl animate-rise text-base leading-relaxed text-muted-foreground sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            {lede}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div
          className="flex shrink-0 animate-rise flex-wrap gap-3"
          style={{ animationDelay: "220ms" }}
        >
          {actions}
        </div>
      ) : null}
    </header>
  );
}

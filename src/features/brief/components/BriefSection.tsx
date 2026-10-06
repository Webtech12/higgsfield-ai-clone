import type { ReactNode } from "react";

/** One numbered step of the brief: a heading, a line on why it matters, then its fields. */
export function BriefSection({
  number,
  title,
  lede,
  id,
  aside,
  children,
}: {
  number: number;
  title: string;
  lede: string;
  /** An anchor, e.g. "cast", for links and for scrolling to the step. */
  id?: string;
  /** A small action on the heading's right, e.g. a link to the full roster. */
  aside?: ReactNode;
  children: ReactNode;
}) {
  const headingId = `brief-step-${String(number)}`;
  return (
    <section id={id} aria-labelledby={headingId} className="scroll-mt-24">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <span
            aria-hidden
            className="mt-1 font-display text-sm font-semibold text-primary tabular-nums"
          >
            {String(number).padStart(2, "0")}
          </span>
          <div>
            <h2
              id={headingId}
              className="font-display text-2xl font-semibold tracking-[-0.02em] sm:text-[1.7rem]"
            >
              {title}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{lede}</p>
          </div>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

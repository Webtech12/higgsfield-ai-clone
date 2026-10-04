import type { ReactNode } from "react";

/** One numbered step of the brief: a heading, a line on why it matters, then its fields. */
export function BriefSection({
  number,
  title,
  lede,
  children,
}: {
  number: number;
  title: string;
  lede: string;
  children: ReactNode;
}) {
  const headingId = `brief-step-${String(number)}`;
  return (
    <section
      aria-labelledby={headingId}
      className="border-t border-border pt-6 first:border-t-0 first:pt-0"
    >
      <div className="mb-4">
        <h2 id={headingId} className="flex items-baseline gap-2.5 font-medium">
          <span className="font-mono text-xs text-primary" aria-hidden>
            {String(number).padStart(2, "0")}
          </span>
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{lede}</p>
      </div>
      {children}
    </section>
  );
}

import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

/** The ids a control's aria-describedby should point at: its error when there is one, else its hint. */
export const describedBy = (id: string, hasError: boolean): string =>
  hasError ? `${id}-error` : `${id}-hint`;

/**
 * A labelled form control with its hint, error and an optional character count. The control itself
 * is the child, carrying `id={id}` and `aria-describedby={describedBy(id, Boolean(error))}`.
 */
export function Field({
  id,
  label,
  hint,
  error,
  optional = false,
  count,
  className,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string | undefined;
  optional?: boolean;
  count?: { value: number; max: number };
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
          {optional ? (
            <span className="ml-1.5 font-normal text-muted-foreground">Optional</span>
          ) : null}
        </label>
        {count ? (
          <span
            className={cn(
              "font-mono text-xs tabular-nums",
              count.value > count.max ? "text-destructive" : "text-muted-foreground",
            )}
            aria-hidden
          >
            {count.value}/{count.max}
          </span>
        ) : null}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs leading-relaxed text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

/** The ids a control's aria-describedby should point at: its error when there is one, else its hint. */
export const describedBy = (id: string, hasError: boolean): string =>
  hasError ? `${id}-error` : `${id}-hint`;

/** A counter shows up from this share of the limit, when the limit starts to matter. */
const NEAR_LIMIT = 0.8;

/** Hidden until the field has focus; it fades rather than appears, so nothing jumps. */
const FADE_UNTIL_FOCUS =
  "opacity-0 transition-opacity duration-300 ease-out-quart group-focus-within/field:opacity-100";

/**
 * A labelled form control with its hint, error and an optional character count. The control itself
 * is the child, carrying `id={id}` and `aria-describedby={describedBy(id, Boolean(error))}`.
 *
 * `quiet` shows the hint and the count only while the field has focus (or the count nears its
 * limit), so a long form isn't a wall of grey text. Screen readers always get the hint.
 */
export function Field({
  id,
  label,
  hint,
  error,
  optional = false,
  count,
  quiet = false,
  className,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string | undefined;
  optional?: boolean;
  count?: { value: number; max: number };
  quiet?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("group/field flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
          {optional ? (
            <span className="ml-1.5 font-normal text-muted-foreground">Optional</span>
          ) : null}
        </label>
        {count ? <FieldCount count={count} quiet={quiet} /> : null}
      </div>
      {children}
      <FieldNote id={id} hint={hint} error={error} quiet={quiet} />
    </div>
  );
}

function FieldCount({ count, quiet }: { count: { value: number; max: number }; quiet: boolean }) {
  const isNearLimit = count.value >= count.max * NEAR_LIMIT;
  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        count.value > count.max ? "text-destructive" : "text-muted-foreground",
        quiet && !isNearLimit && FADE_UNTIL_FOCUS,
      )}
      aria-hidden
    >
      {count.value}/{count.max}
    </span>
  );
}

/** The error when there is one, else the hint. */
function FieldNote({
  id,
  hint,
  error,
  quiet,
}: {
  id: string;
  hint: string | undefined;
  error: string | undefined;
  quiet: boolean;
}) {
  if (error) {
    return (
      <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
        {error}
      </p>
    );
  }
  if (!hint) return null;
  return (
    <p
      id={`${id}-hint`}
      className={cn("text-xs leading-relaxed text-muted-foreground", quiet && FADE_UNTIL_FOCUS)}
    >
      {hint}
    </p>
  );
}

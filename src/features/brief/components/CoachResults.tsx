"use client";

import { Check, Lightbulb } from "lucide-react";

import type { CoachResult, CoachSuggestion } from "@/contracts/ad";
import { Button } from "@/shared/ui";

import { FIELD_COPY, GAP_LABEL } from "../model/briefCopy";

/** What the coach said: rewrites to apply, what's missing, and tips for this brief. */
export function CoachResults({
  result,
  applied,
  onApply,
}: {
  result: CoachResult;
  applied: ReadonlySet<number>;
  onApply: (index: number, suggestion: CoachSuggestion) => void;
}) {
  const pending = result.suggestions.flatMap((s, i) => (applied.has(i) ? [] : [{ s, i }]));
  const isEmpty =
    result.suggestions.length === 0 && result.missing.length === 0 && result.tips.length === 0;
  if (isEmpty) {
    return <p className="mt-4 text-sm">This brief is in good shape. Nothing to change.</p>;
  }
  return (
    <div className="mt-4 flex flex-col gap-4">
      {result.suggestions.length > 0 ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-medium">Suggested rewrites</h4>
            {pending.length > 1 ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  for (const { s, i } of pending) onApply(i, s);
                }}
              >
                Apply all
              </Button>
            ) : null}
          </div>
          <ul className="flex flex-col gap-2">
            {result.suggestions.map((suggestion, index) => (
              <li
                key={`${suggestion.field}-${String(index)}`}
                className="flex flex-col gap-2 rounded-md border border-border bg-background/60 p-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {FIELD_COPY[suggestion.field].label}
                  </p>
                  <p className="mt-0.5 text-sm">“{suggestion.value}”</p>
                  <p className="mt-1 text-xs text-muted-foreground">{suggestion.why}</p>
                </div>
                {applied.has(index) ? (
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs text-success">
                    <Check className="size-3.5" aria-hidden /> Applied
                  </span>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => {
                      onApply(index, suggestion);
                    }}
                  >
                    Apply
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {result.missing.length > 0 ? (
        <div>
          <h4 className="text-sm font-medium">Worth adding</h4>
          <ul className="mt-1.5 flex flex-col gap-1 text-sm">
            {result.missing.map((gap) => (
              <li key={gap.field}>
                <span className="font-medium">{GAP_LABEL[gap.field]}:</span>{" "}
                <span className="text-muted-foreground">{gap.why}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {result.tips.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {result.tips.map((tip) => (
            <li key={tip} className="flex gap-2 text-sm text-muted-foreground">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              {tip}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

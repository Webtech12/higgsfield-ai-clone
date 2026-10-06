import { Check } from "lucide-react";

import { cn } from "@/shared/lib/cn";

const STAGES = [
  { title: "Reading your brief", detail: "Format, product, cast and photos" },
  { title: "Writing three concepts", detail: "Hooks, looks, shots and end cards" },
  { title: "Drawing nine storyboard frames", detail: "Your talent and product in every frame" },
] as const;

/** While planning, the brief has been read and the concepts are being written. */
const ACTIVE_STAGE = 1;

type StageState = "done" | "active" | "next";

const STAGE_SUFFIX = {
  done: " (done)",
  active: " (in progress)",
  next: " (next)",
} satisfies Record<StageState, string>;

/**
 * The wait for a plan, designed (ADR-028): what's happening now, what comes next, and the shape of
 * the result taking form beside it, so a minute of waiting reads as progress, not as a stall.
 */
export function PlanningProgress() {
  return (
    <div className="grid gap-10 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <ol aria-label="Progress" className="space-y-6">
        {STAGES.map((stage, index) => {
          const state: StageState =
            index < ACTIVE_STAGE ? "done" : index === ACTIVE_STAGE ? "active" : "next";
          return (
            <li key={stage.title} className="flex gap-3.5">
              <StageMarker state={state} />
              <span className={cn(state === "next" && "text-muted-foreground")}>
                <span className="block text-sm font-semibold">
                  {stage.title}
                  <span className="sr-only">{STAGE_SUFFIX[state]}</span>
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{stage.detail}</span>
              </span>
            </li>
          );
        })}
      </ol>
      <div className="grid gap-5 sm:grid-cols-3" aria-hidden>
        {[0, 1, 2].map((concept) => (
          <div key={concept} className="rounded-3xl border border-border p-5">
            <div className="h-3 w-20 animate-pulse rounded-full bg-muted" />
            <div className="mt-3 h-7 w-3/4 animate-pulse rounded-lg bg-muted" />
            <div className="mt-2 h-3 w-full animate-pulse rounded-full bg-muted" />
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[0, 1, 2].map((frame) => (
                <div
                  key={frame}
                  className="aspect-[9/16] animate-pulse rounded-lg bg-linear-to-b from-muted to-accent"
                  style={{ animationDelay: `${String((concept * 3 + frame) * 120)}ms` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StageMarker({ state }: { state: StageState }) {
  return (
    <span
      className={cn(
        "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border",
        state === "done" && "border-primary bg-primary text-primary-foreground",
        state === "active" && "border-primary",
        state === "next" && "border-border",
      )}
    >
      {state === "done" ? <Check className="size-3.5" aria-hidden /> : null}
      {state === "active" ? (
        <span className="size-2 animate-pulse rounded-full bg-primary" aria-hidden />
      ) : null}
    </span>
  );
}

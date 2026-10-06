import { cn } from "@/shared/lib/cn";

import type { AdPhase } from "../model/readyAlert";

type PillTone = "working" | "done" | "attention" | "idle";

const PHASE_TONE = {
  planning: "working",
  drawing: "working",
  "concepts-ready": "done",
  chosen: "idle",
  rendering: "working",
  "ad-ready": "done",
  "needs-attention": "attention",
} satisfies Record<AdPhase, PillTone>;

const DOT_CLASS = {
  working: "bg-neon",
  done: "bg-primary",
  attention: "bg-destructive",
  idle: "bg-muted-foreground",
} satisfies Record<PillTone, string>;

/**
 * The page's one live status line, which screen readers announce as it changes. The dot says the
 * same thing at a glance: pulsing while work is under way, green when it's done, red for trouble.
 */
export function StatusPill({ phase, message }: { phase: AdPhase; message: string }) {
  const tone = PHASE_TONE[phase];
  return (
    <p
      aria-live="polite"
      className="inline-flex max-w-full items-center gap-3 rounded-2xl border border-border bg-card/80 py-2 pr-4 pl-3.5 text-sm font-medium sm:rounded-full"
    >
      <span aria-hidden className="relative flex size-2.5 shrink-0">
        {tone === "working" ? (
          <span className="absolute inset-0 animate-ping rounded-full bg-neon/60" />
        ) : null}
        <span className={cn("relative size-2.5 rounded-full", DOT_CLASS[tone])} />
      </span>
      {message}
    </p>
  );
}

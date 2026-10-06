"use client";

import { Clapperboard, LoaderCircle } from "lucide-react";

import type { WorkspaceView } from "@/contracts/project";
import { produceReadiness, type ProduceReadiness } from "@/entities/project";
import { spendCheck, useMe, type SpendCheck } from "@/entities/viewer";
import { errorMessage } from "@/shared/lib/apiErrors";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui";

import type { useBoardActions } from "../hooks/useBoardActions";

type ProduceMutation = ReturnType<typeof useBoardActions>["produce"];

/**
 * The step from storyboard to ad. It shows the price before anything is spent and says plainly
 * why producing can't start: frames still drawing, not enough credits, or today's cap (AGENTS.md §1).
 */
export function ProduceBar({ view, produce }: { view: WorkspaceView; produce: ProduceMutation }) {
  const readiness = produceReadiness(view);
  return (
    <div className="mt-6 flex flex-col gap-5 rounded-3xl border border-border bg-[radial-gradient(120%_160%_at_100%_0%,rgb(150_202_74/10%),transparent_55%)] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
      <div className="max-w-xl space-y-1.5 text-sm">
        <p className="font-display text-xl font-semibold tracking-[-0.01em]">Ready to shoot?</p>
        <p className="leading-relaxed text-muted-foreground">
          Each shot becomes lifelike video that starts from its storyboard frame. Rendering takes
          about 8 minutes.
        </p>
        {readiness.staleCount > 0 ? (
          <p className="text-primary">
            {readiness.staleCount === 1
              ? "1 frame is"
              : `${String(readiness.staleCount)} frames are`}{" "}
            out of date. Producing uses the frame you see, so redraw first to match your edit.
          </p>
        ) : null}
      </div>
      <ProduceButton readiness={readiness} produce={produce} />
    </div>
  );
}

function ProduceButton({
  readiness,
  produce,
}: {
  readiness: ProduceReadiness;
  produce: ProduceMutation;
}) {
  const { data: me } = useMe();
  const spend = spendCheck(me, readiness.shotCount);
  const blocker = readiness.blocker ?? (spend.kind === "blocked" ? spend.message : null);

  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end sm:text-right">
      <Button
        size="lg"
        onClick={() => {
          produce.mutate();
        }}
        disabled={blocker !== null || spend.kind === "loading" || produce.isPending}
      >
        {produce.isPending ? (
          <LoaderCircle className="animate-spin" aria-hidden />
        ) : (
          <Clapperboard aria-hidden />
        )}
        {produce.isPending ? "Starting production…" : buttonLabel(readiness.shotCount, spend)}
      </Button>
      <p className={cn("text-xs", blocker ? "text-primary" : "text-muted-foreground")}>
        {blocker ?? balanceLine(spend)}
      </p>
      {produce.isError ? (
        <p role="alert" className="text-xs text-destructive">
          {errorMessage(produce.error)}
        </p>
      ) : null}
    </div>
  );
}

function buttonLabel(shotCount: number, spend: SpendCheck): string {
  const label = `Produce ${String(shotCount)} shots`;
  return spend.kind === "loading" ? label : `${label} · ${String(spend.cost)} credits`;
}

function balanceLine(spend: SpendCheck): string {
  if (spend.kind !== "ok") return "Checking your credits…";
  const left = spend.balance - spend.cost;
  return `You have ${String(spend.balance)} credits; ${String(left)} left after this.`;
}

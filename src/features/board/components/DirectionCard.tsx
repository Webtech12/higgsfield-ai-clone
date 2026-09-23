"use client";

import { Check } from "lucide-react";

import type { AspectRatio } from "@/contracts/brief";
import type { DirectionView } from "@/contracts/project";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui";

import { ShotCard, type ShotCardActions } from "./ShotCard";

/** A creative direction: its pitch, its look and its three storyboarded shots. */
export function DirectionCard({
  direction,
  ratio,
  isSelected,
  canChoose,
  isChoosing,
  isLocked,
  onChoose,
  shotActions,
}: {
  direction: DirectionView;
  ratio: AspectRatio;
  isSelected: boolean;
  canChoose: boolean;
  /** This direction is the one being chosen right now. */
  isChoosing: boolean;
  /** Some choice is in flight, so every choose button waits. */
  isLocked: boolean;
  onChoose: () => void;
  shotActions: ((shotId: string) => ShotCardActions) | null;
}) {
  const headingId = `direction-${direction.id}`;
  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "rounded-xl border bg-card/40 p-4 sm:p-5",
        isSelected ? "border-primary/50 shadow-lg shadow-primary/5" : "border-border",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className="font-mono text-xs text-muted-foreground">
            Direction {direction.ordinal + 1}
          </p>
          <h3 id={headingId} className="mt-1 font-display text-3xl tracking-tight">
            {direction.name}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed">{direction.tagline}</p>
          <p className="mt-1 text-xs text-muted-foreground">Look: {direction.look}</p>
        </div>
        {isSelected ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-primary/40 px-3 py-1 text-xs text-primary">
            <Check className="size-3.5" aria-hidden /> Your direction
          </span>
        ) : canChoose ? (
          <Button onClick={onChoose} disabled={isLocked} className="shrink-0 self-start">
            {isChoosing ? "Choosing…" : "Choose this direction"}
          </Button>
        ) : null}
      </div>

      <ol className="mt-5 grid gap-4 sm:grid-cols-3">
        {direction.shots.map((shot, index) => (
          <ShotCard
            key={shot.id}
            shot={shot}
            ratio={ratio}
            number={index + 1}
            actions={shotActions ? shotActions(shot.id) : null}
          />
        ))}
      </ol>
    </section>
  );
}

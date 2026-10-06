"use client";

import type { AspectRatio } from "@/contracts/brief";
import type { DirectionView } from "@/contracts/project";
import { conceptPitch } from "@/entities/project";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui";

import { ConceptPitch } from "./ConceptPitch";
import { CompactShot } from "./ShotCard";

/** Three frames side by side, except wide ones: one large, two below. */
const FRAME_GRID = {
  "9:16": "grid-cols-3",
  "1:1": "grid-cols-3",
  "16:9": "grid-cols-2 [&>li:first-child]:col-span-2",
} satisfies Record<AspectRatio, string>;

/**
 * One concept as a column of the comparison (ADR-028): its angle, its three frames, its pitch and
 * the choice. Columns sit side by side, so comparing them is a glance, not a scroll. On wide screens
 * each column is a subgrid of the comparison's seven rows (heading, frames, hook, end card, music,
 * look, choice), so the same part of every concept lines up across columns.
 */
export function ConceptCard({
  direction,
  ratio,
  canChoose,
  isChoosing,
  isLocked,
  onChoose,
}: {
  direction: DirectionView;
  ratio: AspectRatio;
  canChoose: boolean;
  /** This concept is the one being chosen right now. */
  isChoosing: boolean;
  /** Some choice is in flight, so every choose button waits. */
  isLocked: boolean;
  onChoose: () => void;
}) {
  const headingId = `concept-${direction.id}`;
  const pitch = conceptPitch(direction);
  return (
    <section
      aria-labelledby={headingId}
      className="flex h-full flex-col rounded-3xl border border-border bg-card/60 p-5 transition-[border-color] duration-300 ease-out-quart hover:border-foreground/20 sm:p-6 lg:row-span-7 lg:grid lg:grid-rows-subgrid"
    >
      <div>
        <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
          Concept {direction.ordinal + 1}
        </p>
        <h2
          id={headingId}
          className="mt-2 font-display text-2xl leading-tight font-semibold tracking-[-0.02em]"
        >
          {direction.name}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{direction.tagline}</p>
      </div>

      <ol className={cn("mt-5 grid gap-2", FRAME_GRID[ratio])} aria-label="Storyboard">
        {direction.shots.map((shot, index) => (
          <CompactShot key={shot.id} shot={shot} ratio={ratio} number={index + 1} />
        ))}
      </ol>

      {pitch ? (
        // Its hook, end card and music are three rows of the column's subgrid.
        <ConceptPitch
          pitch={pitch}
          layout="stack"
          className="lg:row-span-3 lg:grid lg:grid-rows-subgrid"
        />
      ) : null}
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground/80">Look</span> · {direction.look}
      </p>

      {canChoose ? (
        <div className="mt-auto pt-6 lg:mt-0 lg:self-end">
          <Button onClick={onChoose} disabled={isLocked} size="lg" className="w-full">
            {isChoosing ? "Choosing…" : "Choose this concept"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

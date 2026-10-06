"use client";

import { Check } from "lucide-react";

import type { AspectRatio } from "@/contracts/brief";
import type { DirectionView } from "@/contracts/project";
import { conceptPitch } from "@/entities/project";
import { cn } from "@/shared/lib/cn";

import { ConceptPitch } from "./ConceptPitch";
import { ShotCard, type ShotCardActions } from "./ShotCard";

/**
 * The chosen concept, in full: its pitch and its three shots, editable by the owner. Tall (9:16)
 * frames sit beside the pitch on wide screens rather than under it, so producing stays near the
 * fold; on phones the shots swipe sideways.
 */
export function DirectionCard({
  direction,
  ratio,
  shotActions,
}: {
  direction: DirectionView;
  ratio: AspectRatio;
  shotActions: ((shotId: string) => ShotCardActions) | null;
}) {
  const headingId = `direction-${direction.id}`;
  const pitch = conceptPitch(direction);
  const isPortrait = ratio === "9:16";
  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "rounded-3xl border border-primary/40 bg-card/60 p-5 shadow-[0_40px_90px_-50px_rgb(150_202_74/45%)] sm:p-7",
        isPortrait && "lg:grid lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-10",
      )}
    >
      <div>
        <div
          className={cn(
            "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
            // Beside tall frames the column is narrow: the "Your concept" chip goes above the name.
            isPortrait && "lg:flex-col-reverse",
          )}
        >
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
              Concept {direction.ordinal + 1}
            </p>
            <h2
              id={headingId}
              className="mt-2 font-display text-3xl font-semibold tracking-[-0.025em] sm:text-4xl"
            >
              {direction.name}
            </h2>
            <p className="mt-2 leading-relaxed">{direction.tagline}</p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">Look</span> · {direction.look}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground">
            <Check className="size-3.5" aria-hidden /> Your concept
          </span>
        </div>
        {pitch ? <ConceptPitch pitch={pitch} layout={isPortrait ? "stack" : "row"} /> : null}
      </div>

      <ol
        className={cn(
          "-mx-5 mt-7 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0",
          "[&>li]:w-[72%] [&>li]:shrink-0 [&>li]:snap-start sm:[&>li]:w-auto",
          isPortrait && "lg:mt-0",
        )}
      >
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

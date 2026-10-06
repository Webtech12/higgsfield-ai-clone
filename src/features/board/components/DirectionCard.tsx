"use client";

import { Check } from "lucide-react";

import type { AspectRatio } from "@/contracts/brief";
import type { DirectionView } from "@/contracts/project";
import { conceptPitch } from "@/entities/project";

import { ConceptPitch } from "./ConceptPitch";
import { ShotCard, type ShotCardActions } from "./ShotCard";

/** The chosen concept, in full: its pitch and its three shots, editable by the owner. */
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
  return (
    <section
      aria-labelledby={headingId}
      className="rounded-3xl border border-primary/40 bg-card/60 p-5 shadow-[0_40px_90px_-50px_rgb(150_202_74/45%)] sm:p-7"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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

      {pitch ? <ConceptPitch pitch={pitch} /> : null}

      <ol className="mt-7 grid gap-6 sm:grid-cols-3">
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

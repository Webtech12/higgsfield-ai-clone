"use client";

import { ArrowDown, Check } from "lucide-react";
import Link from "next/link";

import type { TalentCardModel } from "@/entities/talent";
import { cn } from "@/shared/lib/cn";
import { Button, FadeInImage } from "@/shared/ui";

/** As many faces as fit with weight; the rest are a click away on the Talent page. */
const WALL_SIZE = 6;

/**
 * The first screen (ADR-028), after Citrus Talent's own homepage: the roster's real faces in
 * grayscale strips under a headline you can't miss. A face comes to colour on hover, and clicking it
 * casts that person in the brief below: the hero is the first step of the brief, not a poster.
 */
export function TalentWall({
  roster,
  castId,
  onCast,
}: {
  roster: TalentCardModel[];
  castId: string | null;
  onCast: (talentId: string) => void;
}) {
  const faces = roster.slice(0, WALL_SIZE);
  return (
    <section
      aria-labelledby="wall-heading"
      className="relative isolate overflow-hidden border-b border-border bg-[#050505]"
    >
      {faces.length > 0 ? (
        <ul aria-label="Cast from the roster" className="absolute inset-0 hidden md:flex">
          {faces.map((talent, index) => (
            <li
              key={talent.id}
              className="relative flex-1 animate-wipe border-r border-black/70 last:border-r-0"
              style={{ animationDelay: `${String(250 + index * 90)}ms` }}
            >
              <WallFace talent={talent} isCast={castId === talent.id} onCast={onCast} />
            </li>
          ))}
        </ul>
      ) : null}
      {/* Keeps the headline readable over any face; it lets clicks through to the strips. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(90deg,rgb(5_5_5/94%)_0%,rgb(5_5_5/70%)_42%,rgb(5_5_5/10%)_78%),linear-gradient(0deg,rgb(5_5_5/90%)_0%,transparent_45%)] md:block"
      />
      {/* The words let clicks through to the faces behind them; only the buttons take them. */}
      <div className="pointer-events-none relative mx-auto flex min-h-[64svh] w-full max-w-7xl flex-col justify-end px-4 pt-16 pb-10 sm:px-6 md:min-h-[min(78svh,760px)] md:pb-16">
        <div className="max-w-3xl">
          <p className="animate-rise text-xs font-semibold tracking-[0.22em] text-primary uppercase">
            Citrus Talent Studio
          </p>
          <h1
            id="wall-heading"
            className="mt-5 font-display text-[clamp(3.25rem,8.6vw,8.25rem)] leading-[0.88] font-semibold tracking-[-0.045em]"
          >
            <span className="block animate-rise" style={{ animationDelay: "90ms" }}>
              Cast an icon.
            </span>
            <span className="block animate-rise text-primary" style={{ animationDelay: "190ms" }}>
              Ship the ad.
            </span>
          </h1>
          <p
            className="mt-7 max-w-xl animate-rise text-lg leading-relaxed text-white/75"
            style={{ animationDelay: "300ms" }}
          >
            Real talent with signed releases, your product, and three storyboarded concepts in about
            a minute. The one you choose becomes a finished ad.
          </p>
          <div
            className="pointer-events-auto mt-9 flex animate-rise flex-wrap gap-3"
            style={{ animationDelay: "400ms" }}
          >
            <Button asChild size="lg">
              <a href="#brief">
                Start your brief <ArrowDown aria-hidden />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/demo">Watch an example</Link>
            </Button>
          </div>
        </div>
      </div>
      {faces.length > 0 ? (
        <ul
          aria-label="Cast from the roster"
          className="relative flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-10 md:hidden"
        >
          {faces.map((talent) => (
            <li key={talent.id} className="relative aspect-[3/4] w-32 shrink-0 snap-start">
              <WallFace talent={talent} isCast={castId === talent.id} onCast={onCast} />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/** One face on the wall: grayscale until hovered or cast, named on hover, cast on click. */
function WallFace({
  talent,
  isCast,
  onCast,
}: {
  talent: TalentCardModel;
  isCast: boolean;
  onCast: (talentId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        onCast(talent.id);
      }}
      aria-pressed={isCast}
      aria-label={`${talent.name}: cast in your ad`}
      className="group/face absolute inset-0 overflow-hidden rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-primary focus-visible:ring-inset md:rounded-none"
    >
      <FadeInImage
        src={talent.cover.url}
        alt=""
        className={cn(
          "absolute inset-0 size-full object-cover transition-[filter,transform,opacity] duration-1000 ease-out-expo group-hover/face:scale-[1.04] group-focus-visible/face:scale-[1.04]",
          isCast
            ? "grayscale-0"
            : "grayscale group-hover/face:grayscale-0 group-focus-visible/face:grayscale-0",
        )}
      />
      <span
        className={cn(
          "absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-linear-to-t from-black/85 to-transparent p-3 text-left transition-[opacity,transform] duration-500 ease-out-expo md:p-5",
          isCast
            ? "opacity-100"
            : "md:translate-y-2 md:opacity-0 md:group-hover/face:translate-y-0 md:group-hover/face:opacity-100 md:group-focus-visible/face:translate-y-0 md:group-focus-visible/face:opacity-100",
        )}
      >
        <span className="min-w-0">
          <span className="block truncate font-display text-sm font-semibold text-white md:text-lg">
            {talent.name}
          </span>
          <span className="hidden truncate text-xs text-white/70 md:block">{talent.tagline}</span>
        </span>
        {isCast ? (
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-4" aria-hidden />
          </span>
        ) : null}
      </span>
      {isCast ? (
        <span
          aria-hidden
          className="absolute inset-0 rounded-xl ring-[3px] ring-primary ring-inset md:rounded-none"
        />
      ) : null}
    </button>
  );
}

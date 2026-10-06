"use client";

import { ShieldCheck } from "lucide-react";
import { useState, type ReactNode } from "react";

import { cn } from "@/shared/lib/cn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  FadeInImage,
} from "@/shared/ui";

import type { TalentCardModel } from "../model/talentCard";

/**
 * The full profile in a dialog, like a casting sheet: a large photo with the others to flip through,
 * then the bio and the release on file (ADR-024), and the caller's action at the foot.
 */
export function TalentProfile({
  talent,
  trigger,
  action,
}: {
  talent: TalentCardModel;
  trigger: ReactNode;
  /** E.g. "Cast Ava": rendered at the foot of the profile. */
  action?: ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl gap-6 sm:grid-cols-2 sm:gap-8">
        <ProfilePhotos talent={talent} />
        <div className="flex min-w-0 flex-col gap-5 sm:py-2">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
              Citrus Talent roster
            </p>
            <DialogTitle className="mt-3">{talent.name}</DialogTitle>
            <DialogDescription className="mt-2 text-base">{talent.tagline}</DialogDescription>
          </div>
          {talent.tags.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5" aria-label="Known for">
              {talent.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="text-sm leading-relaxed text-foreground/85">{talent.bio}</p>
          <div className="flex gap-3 rounded-xl border border-border bg-background/40 p-4 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <p>
              <span className="font-medium text-foreground">{talent.consentLine}.</span>{" "}
              {talent.consentScope}
            </p>
          </div>
          {action ? <div className="mt-auto pt-1">{action}</div> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** One large photo; the thumbnails under it choose which. */
function ProfilePhotos({ talent }: { talent: TalentCardModel }) {
  const [shownIndex, setShownIndex] = useState(0);
  const shown = talent.photos[shownIndex] ?? talent.cover;
  const count = talent.photos.length;
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
        <FadeInImage
          src={shown.url}
          alt={shown.alt}
          className="absolute inset-0 size-full object-cover"
        />
      </div>
      {count > 1 ? (
        <ul className="grid grid-cols-4 gap-2" aria-label={`Photos of ${talent.name}`}>
          {talent.photos.map((photo, index) => (
            <li key={photo.url}>
              <button
                type="button"
                aria-label={`Show photo ${String(index + 1)} of ${String(count)}`}
                aria-pressed={index === shownIndex}
                onClick={() => {
                  setShownIndex(index);
                }}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden rounded-lg bg-muted ring-offset-2 ring-offset-popover transition-opacity duration-200 ease-out-quart outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  index === shownIndex ? "ring-2 ring-primary" : "opacity-55 hover:opacity-100",
                )}
              >
                <FadeInImage
                  src={photo.url}
                  alt=""
                  className="absolute inset-0 size-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

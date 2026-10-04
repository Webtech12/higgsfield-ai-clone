import { ShieldCheck } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { FadeInImage } from "@/shared/ui";

import type { TalentCardModel } from "../model/talentCard";

/** A talent at a glance: portrait, name, tagline and tags. Selection is the caller's control. */
export function TalentCard({
  talent,
  isSelected = false,
  className,
}: {
  talent: TalentCardModel;
  isSelected?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-card/60 transition-colors",
        isSelected ? "border-primary shadow-lg shadow-primary/10" : "border-border",
        className,
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        <FadeInImage
          src={talent.cover.url}
          alt={talent.cover.alt}
          className="absolute inset-0 size-full object-cover"
        />
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-[11px] text-foreground backdrop-blur">
          <ShieldCheck className="size-3 text-success" aria-hidden /> Consent on file
        </span>
      </div>
      <div className="p-3">
        <p className="font-medium">{talent.name}</p>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {talent.tagline}
        </p>
        {talent.tags.length > 0 ? (
          <p className="mt-2 flex flex-wrap gap-1">
            {talent.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </p>
        ) : null}
      </div>
    </div>
  );
}

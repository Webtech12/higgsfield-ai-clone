import { Check, ShieldCheck } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { FadeInImage } from "@/shared/ui";

import type { TalentCardModel } from "../model/talentCard";

/**
 * A talent at a glance: portrait, name, tagline and tags. In grayscale until hovered or cast, as on
 * Citrus Talent's own site; cast, they're in colour with a green outline. Selection is the caller's
 * control.
 */
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
        "group/talent overflow-hidden rounded-2xl border bg-card transition-[border-color,box-shadow] duration-300 ease-out-quart",
        isSelected
          ? "border-primary shadow-[0_0_0_1px_var(--primary),0_18px_40px_-20px_rgb(150_202_74/60%)]"
          : "border-border hover:border-foreground/25",
        className,
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        <FadeInImage
          src={talent.cover.url}
          alt={talent.cover.alt}
          className={cn(
            "absolute inset-0 size-full object-cover transition-[filter,transform] duration-700 ease-out-expo",
            isSelected
              ? "grayscale-0"
              : "grayscale group-hover/talent:scale-[1.03] group-hover/talent:grayscale-0",
          )}
        />
        {isSelected ? (
          <span className="absolute top-2.5 right-2.5 grid size-7 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg">
            <Check className="size-4" aria-hidden />
          </span>
        ) : null}
        <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[11px] text-white backdrop-blur">
          <ShieldCheck className="size-3 text-primary" aria-hidden /> Consent on file
        </span>
      </div>
      <div className="p-3.5">
        <p className="font-display font-semibold tracking-[-0.01em]">{talent.name}</p>
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

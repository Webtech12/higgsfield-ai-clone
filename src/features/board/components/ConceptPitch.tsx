import { Megaphone, Music, Sparkles } from "lucide-react";

import type { ConceptPitch as ConceptPitchModel } from "@/entities/project";
import { cn } from "@/shared/lib/cn";

/**
 * A concept's pitch: the hook, the end card and the music bed. Stacked in a comparison column,
 * side by side once the concept is chosen.
 */
export function ConceptPitch({
  pitch,
  layout = "row",
}: {
  pitch: ConceptPitchModel;
  layout?: "row" | "stack";
}) {
  const isStack = layout === "stack";
  const item = cn(
    isStack
      ? "border-t border-border pt-3 first:border-t-0 first:pt-0"
      : "rounded-2xl bg-white/[0.03] p-4",
  );
  const term = "flex items-center gap-1.5 text-xs font-medium text-muted-foreground";
  return (
    <dl className={cn("text-sm", isStack ? "mt-5 space-y-3" : "mt-6 grid gap-3 sm:grid-cols-3")}>
      <div className={item}>
        <dt className={term}>
          <Sparkles className="size-3.5 text-primary" aria-hidden /> Hook
        </dt>
        <dd className="mt-1 leading-relaxed">{pitch.hook}</dd>
      </div>
      <div className={item}>
        <dt className={term}>
          <Megaphone className="size-3.5 text-primary" aria-hidden /> End card
        </dt>
        <dd className="mt-1 leading-relaxed">
          <span className="font-semibold">{pitch.headline}</span>
          <span className="mt-0.5 block text-primary">{pitch.cta}</span>
        </dd>
      </div>
      <div className={item}>
        <dt className={term}>
          <Music className="size-3.5 text-primary" aria-hidden /> Music
        </dt>
        <dd className="mt-1 leading-relaxed text-muted-foreground">{pitch.music}</dd>
      </div>
    </dl>
  );
}

import { Megaphone, Music, Sparkles } from "lucide-react";

import type { ConceptPitch as ConceptPitchModel } from "@/entities/project";

/** A concept's pitch at a glance: the hook, the end card and the music bed. */
export function ConceptPitch({ pitch }: { pitch: ConceptPitchModel }) {
  return (
    <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
      <div className="rounded-md border border-border bg-background/40 p-3">
        <dt className="flex items-center gap-1.5 text-muted-foreground">
          <Sparkles className="size-3.5" aria-hidden /> Hook
        </dt>
        <dd className="mt-1 leading-relaxed">{pitch.hook}</dd>
      </div>
      <div className="rounded-md border border-border bg-background/40 p-3">
        <dt className="flex items-center gap-1.5 text-muted-foreground">
          <Megaphone className="size-3.5" aria-hidden /> End card
        </dt>
        <dd className="mt-1 leading-relaxed">
          <span className="font-medium">{pitch.headline}</span>
          <span className="mt-1 block text-primary">{pitch.cta}</span>
        </dd>
      </div>
      <div className="rounded-md border border-border bg-background/40 p-3">
        <dt className="flex items-center gap-1.5 text-muted-foreground">
          <Music className="size-3.5" aria-hidden /> Music
        </dt>
        <dd className="mt-1 leading-relaxed">{pitch.music}</dd>
      </div>
    </dl>
  );
}

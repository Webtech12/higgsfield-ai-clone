import type { AspectRatio } from "@/contracts/brief";
import type { DirectionView } from "@/contracts/project";
import { frameState } from "@/entities/project";
import { cn } from "@/shared/lib/cn";
import { ASPECT_CLASS, FadeInImage } from "@/shared/ui";

/** The thumbnails keep each concept's shape at a glance. */
const THUMB_WIDTH = { "9:16": "w-9", "1:1": "w-12", "16:9": "w-16" } satisfies Record<
  AspectRatio,
  string
>;

/**
 * Once a concept is chosen, the other two step back: still visible, so the choice stays in context,
 * but quiet, because the choice is made.
 */
export function OtherConcepts({
  directions,
  ratio,
}: {
  directions: DirectionView[];
  ratio: AspectRatio;
}) {
  if (directions.length === 0) return null;
  return (
    <section aria-labelledby="other-concepts">
      <h2
        id="other-concepts"
        className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase"
      >
        Other concepts
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {directions.map((direction) => (
          <li
            key={direction.id}
            className="flex items-center gap-4 rounded-2xl border border-border p-3 opacity-75"
          >
            <span className="flex shrink-0 gap-1" aria-hidden>
              {direction.shots.map((shot) => {
                const state = frameState(shot);
                return (
                  <span
                    key={shot.id}
                    className={cn(
                      "relative overflow-hidden rounded-md bg-muted",
                      ASPECT_CLASS[ratio],
                      THUMB_WIDTH[ratio],
                    )}
                  >
                    {state.kind === "ready" ? (
                      <FadeInImage
                        src={state.url}
                        alt=""
                        className="absolute inset-0 size-full object-cover grayscale"
                      />
                    ) : null}
                  </span>
                );
              })}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display font-semibold">{direction.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {direction.tagline}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

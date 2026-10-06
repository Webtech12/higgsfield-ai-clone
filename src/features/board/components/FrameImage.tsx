import { ImageOff, LoaderCircle } from "lucide-react";

import type { AspectRatio } from "@/contracts/brief";
import type { FrameState } from "@/entities/project";
import { cn } from "@/shared/lib/cn";
import { ASPECT_CLASS, FadeInImage } from "@/shared/ui";

/**
 * One storyboard frame with its designed waiting, drawing, failed and ready states. A frame that
 * arrives is wiped in from the top, so finishing frames read as the board developing (ADR-028).
 */
export function FrameImage({
  state,
  ratio,
  alt,
  isCompact = false,
}: {
  state: FrameState;
  ratio: AspectRatio;
  alt: string;
  /** Small frames side by side: shorter status text. */
  isCompact?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl border border-border bg-muted",
        ASPECT_CLASS[ratio],
      )}
    >
      {state.kind === "ready" ? (
        <FadeInImage
          src={state.url}
          alt={alt}
          reveal="wipe"
          className={cn(
            "size-full object-cover transition-[filter] duration-500",
            state.isRedrawing && "brightness-50",
          )}
        />
      ) : null}
      <FrameOverlay state={state} isCompact={isCompact} />
    </div>
  );
}

function FrameOverlay({ state, isCompact }: { state: FrameState; isCompact: boolean }) {
  const isBusy =
    state.kind === "waiting" ||
    state.kind === "drawing" ||
    (state.kind === "ready" && state.isRedrawing);

  if (state.kind === "failed") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2 text-center text-xs text-destructive">
        <ImageOff className="size-5" aria-hidden />
        {isCompact ? <span className="sr-only">{state.message}</span> : state.message}
      </div>
    );
  }
  if (!isBusy) return null;
  const label = state.kind === "waiting" ? "Waiting for the storyboard" : "Drawing frame…";
  return (
    <>
      {state.kind === "ready" ? null : (
        <div className="absolute inset-0 animate-pulse bg-linear-to-b from-muted via-accent to-muted opacity-70" />
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2 text-center text-xs text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
        {isCompact ? <span className="sr-only">{label}</span> : label}
      </div>
    </>
  );
}

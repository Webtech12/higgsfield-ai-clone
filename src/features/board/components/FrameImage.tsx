import { ImageOff, LoaderCircle } from "lucide-react";

import type { AspectRatio } from "@/contracts/brief";
import type { FrameState } from "@/entities/project";
import { cn } from "@/shared/lib/cn";
import { ASPECT_CLASS } from "@/shared/ui";

/** One storyboard frame with its designed waiting, drawing, failed and ready states. */
export function FrameImage({
  state,
  ratio,
  alt,
}: {
  state: FrameState;
  ratio: AspectRatio;
  alt: string;
}) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-lg border border-border bg-muted",
        ASPECT_CLASS[ratio],
      )}
    >
      {state.kind === "ready" ? (
        // Plain <img>: frames are small storyboard stills from our own origin or bucket.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={state.url}
          alt={alt}
          className={cn(
            "size-full object-cover transition-opacity",
            state.isRedrawing && "opacity-40",
          )}
        />
      ) : null}
      <FrameOverlay state={state} />
    </div>
  );
}

function FrameOverlay({ state }: { state: FrameState }) {
  const isBusy =
    state.kind === "waiting" ||
    state.kind === "drawing" ||
    (state.kind === "ready" && state.isRedrawing);

  if (state.kind === "failed") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-3 text-center text-xs text-destructive">
        <ImageOff className="size-5" aria-hidden />
        {state.message}
      </div>
    );
  }
  if (!isBusy) return null;
  return (
    <>
      {state.kind === "ready" ? null : (
        <div className="absolute inset-0 animate-pulse bg-linear-to-br from-muted via-accent to-muted opacity-60" />
      )}
      <div className="absolute inset-0 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
        {state.kind === "waiting" ? "Waiting for the storyboard" : "Drawing frame…"}
      </div>
    </>
  );
}

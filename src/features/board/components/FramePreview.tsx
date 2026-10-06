"use client";

import type { ReactNode } from "react";

import type { AspectRatio } from "@/contracts/brief";
import type { ShotView } from "@/contracts/project";
import { CAMERA_MOVE_LABEL } from "@/entities/project";
import { cn } from "@/shared/lib/cn";
import {
  ASPECT_CLASS,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  FadeInImage,
} from "@/shared/ui";

/** The enlarged frame fits the screen whatever its shape. */
const PREVIEW_WIDTH = {
  "9:16": "w-[min(100%,calc(62dvh*9/16))]",
  "1:1": "w-[min(100%,62dvh)]",
  "16:9": "w-full",
} satisfies Record<AspectRatio, string>;

/**
 * A storyboard frame you can open up: small frames are for comparing, but a frame is a decision, so
 * one click shows it large with what the camera does in the shot.
 */
export function FramePreview({
  shot,
  number,
  ratio,
  url,
  children,
}: {
  shot: ShotView;
  number: number;
  ratio: AspectRatio;
  url: string;
  /** The small frame: it becomes the button that opens the preview. */
  children: ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Enlarge shot ${String(number)}: ${shot.title}`}
          className="block w-full cursor-zoom-in rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {children}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <div>
          <DialogTitle>
            {number}. {shot.title}
          </DialogTitle>
          <DialogDescription>
            {CAMERA_MOVE_LABEL[shot.cameraMove]} · {shot.durationS}s
          </DialogDescription>
        </div>
        <div
          className={cn(
            "relative mx-auto overflow-hidden rounded-xl bg-muted",
            ASPECT_CLASS[ratio],
            PREVIEW_WIDTH[ratio],
          )}
        >
          <FadeInImage src={url} alt={shot.description} className="size-full object-cover" />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{shot.description}</p>
      </DialogContent>
    </Dialog>
  );
}

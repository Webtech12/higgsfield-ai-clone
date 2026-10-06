"use client";

import { Pencil, RefreshCw } from "lucide-react";
import { useState } from "react";

import type { AspectRatio } from "@/contracts/brief";
import type { CameraMove, ShotDuration, ShotView } from "@/contracts/project";
import { CAMERA_MOVE_LABEL, frameState } from "@/entities/project";
import { Button } from "@/shared/ui";

import { FrameImage } from "./FrameImage";
import { FramePreview } from "./FramePreview";
import { ShotEditor } from "./ShotEditor";

export interface ShotCardActions {
  isSaving: boolean;
  isRedrawing: boolean;
  onSave: (patch: { description: string; cameraMove: CameraMove; durationS: ShotDuration }) => void;
  onRedraw: () => void;
}

/** A shot's frame; once drawn, it opens large on click. */
function ShotFrame({
  shot,
  ratio,
  number,
  isCompact,
}: {
  shot: ShotView;
  ratio: AspectRatio;
  number: number;
  isCompact: boolean;
}) {
  const state = frameState(shot);
  const frame = (
    <FrameImage
      state={state}
      ratio={ratio}
      alt={`${shot.title}: ${shot.description}`}
      isCompact={isCompact}
    />
  );
  return state.kind === "ready" ? (
    <FramePreview shot={shot} number={number} ratio={ratio} url={state.url}>
      {frame}
    </FramePreview>
  ) : (
    frame
  );
}

/** A shot at comparison size: the frame, the beat and the camera, nothing more. */
export function CompactShot({
  shot,
  ratio,
  number,
}: {
  shot: ShotView;
  ratio: AspectRatio;
  number: number;
}) {
  return (
    <li className="flex min-w-0 flex-col">
      <ShotFrame shot={shot} ratio={ratio} number={number} isCompact />
      <p className="mt-2 truncate text-xs font-semibold">
        <span className="sr-only">Shot {number}: </span>
        {shot.title}
      </p>
      <p className="truncate text-[11px] text-muted-foreground">
        {CAMERA_MOVE_LABEL[shot.cameraMove]} · {shot.durationS}s
      </p>
    </li>
  );
}

/** One storyboard shot in full. Editable only in the chosen concept, by its owner. */
export function ShotCard({
  shot,
  ratio,
  number,
  actions,
}: {
  shot: ShotView;
  ratio: AspectRatio;
  number: number;
  actions: ShotCardActions | null;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const state = frameState(shot);

  return (
    <li className="flex flex-col">
      <ShotFrame shot={shot} ratio={ratio} number={number} isCompact={false} />
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">
          <span className="mr-1.5 text-xs text-primary tabular-nums" aria-hidden>
            {number}
          </span>
          <span className="sr-only">Shot {number}: </span>
          {shot.title}
        </h3>
        <span className="shrink-0 text-xs text-muted-foreground">
          {CAMERA_MOVE_LABEL[shot.cameraMove]} · {shot.durationS}s
        </span>
      </div>

      {actions && isEditing ? (
        <ShotEditor
          shot={shot}
          isSaving={actions.isSaving}
          onSave={(patch) => {
            actions.onSave(patch);
            setIsEditing(false);
          }}
          onCancel={() => {
            setIsEditing(false);
          }}
        />
      ) : (
        <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
          {shot.description}
        </p>
      )}

      {actions && !isEditing ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2"
            onClick={() => {
              setIsEditing(true);
            }}
            aria-label={`Edit shot ${String(number)}`}
          >
            <Pencil aria-hidden /> Edit
          </Button>
          {shot.frameStale ? (
            <span className="text-xs font-medium text-primary">Frame out of date</span>
          ) : null}
          {/* A failed frame blocks production, so it can be redrawn without editing first. */}
          {shot.frameStale || state.kind === "failed" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={actions.onRedraw}
              disabled={actions.isRedrawing || (state.kind === "ready" && state.isRedrawing)}
            >
              <RefreshCw aria-hidden /> Redraw frame
            </Button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

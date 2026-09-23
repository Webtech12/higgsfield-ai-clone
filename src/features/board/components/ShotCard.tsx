"use client";

import { Pencil, RefreshCw } from "lucide-react";
import { useState } from "react";

import type { AspectRatio } from "@/contracts/brief";
import type { CameraMove, ShotDuration, ShotView } from "@/contracts/project";
import { CAMERA_MOVE_LABEL, frameState } from "@/entities/project";
import { Button } from "@/shared/ui";

import { FrameImage } from "./FrameImage";
import { ShotEditor } from "./ShotEditor";

export interface ShotCardActions {
  isSaving: boolean;
  isRedrawing: boolean;
  onSave: (patch: { description: string; cameraMove: CameraMove; durationS: ShotDuration }) => void;
  onRedraw: () => void;
}

/** One storyboard shot. Editable only in the chosen direction, by its owner. */
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
      <FrameImage state={state} ratio={ratio} alt={`${shot.title}: ${shot.description}`} />
      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <h4 className="text-sm font-medium">
          <span className="mr-1.5 font-mono text-xs text-muted-foreground" aria-hidden>
            {number}
          </span>
          <span className="sr-only">Shot {number}: </span>
          {shot.title}
        </h4>
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
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsEditing(true);
            }}
            aria-label={`Edit shot ${String(number)}`}
          >
            <Pencil aria-hidden /> Edit
          </Button>
          {shot.frameStale ? (
            <>
              <span className="text-xs text-primary">Frame out of date</span>
              <Button
                variant="outline"
                size="sm"
                onClick={actions.onRedraw}
                disabled={actions.isRedrawing || (state.kind === "ready" && state.isRedrawing)}
              >
                <RefreshCw aria-hidden /> Redraw frame
              </Button>
            </>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

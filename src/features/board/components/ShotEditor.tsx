"use client";

import { useId, useState } from "react";

import {
  CAMERA_MOVES,
  SHOT_DURATIONS,
  type CameraMove,
  type ShotDuration,
  type ShotView,
} from "@/contracts/project";
import { CAMERA_MOVE_LABEL } from "@/entities/project";
import { Button } from "@/shared/ui";

const fieldClass =
  "bg-background border-input focus-visible:ring-ring w-full rounded-md border px-2.5 py-1.5 text-sm focus-visible:ring-2 focus-visible:outline-none";

/** Inline recipe editor for one shot in the chosen direction. */
export function ShotEditor({
  shot,
  isSaving,
  onSave,
  onCancel,
}: {
  shot: ShotView;
  isSaving: boolean;
  onSave: (patch: { description: string; cameraMove: CameraMove; durationS: ShotDuration }) => void;
  onCancel: () => void;
}) {
  const id = useId();
  const [description, setDescription] = useState(shot.description);
  const [cameraMove, setCameraMove] = useState<CameraMove>(shot.cameraMove);
  const [durationS, setDurationS] = useState<ShotDuration>(shot.durationS);

  return (
    <form
      className="mt-3 space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ description: description.trim(), cameraMove, durationS });
      }}
    >
      <div>
        <label htmlFor={`${id}-desc`} className="text-xs text-muted-foreground">
          What the camera sees
        </label>
        <textarea
          id={`${id}-desc`}
          value={description}
          onChange={(event) => {
            setDescription(event.target.value);
          }}
          rows={3}
          minLength={3}
          maxLength={400}
          required
          className={`${fieldClass} mt-1 resize-none`}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor={`${id}-move`} className="text-xs text-muted-foreground">
            Camera move
          </label>
          <select
            id={`${id}-move`}
            value={cameraMove}
            onChange={(event) => {
              setCameraMove(event.target.value as CameraMove);
            }}
            className={`${fieldClass} mt-1`}
          >
            {CAMERA_MOVES.map((move) => (
              <option key={move} value={move}>
                {CAMERA_MOVE_LABEL[move]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-dur`} className="text-xs text-muted-foreground">
            Duration
          </label>
          <select
            id={`${id}-dur`}
            value={durationS}
            onChange={(event) => {
              setDurationS(Number(event.target.value) as ShotDuration);
            }}
            className={`${fieldClass} mt-1`}
          >
            {SHOT_DURATIONS.map((d) => (
              <option key={d} value={d}>
                {d}s
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isSaving}>
          {isSaving ? "Saving…" : "Save shot"}
        </Button>
      </div>
    </form>
  );
}

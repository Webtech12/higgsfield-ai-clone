import type { AssetView, CameraMove, ShotView, WorkspaceView } from "@/contracts/project";

import { ASSET_STATUS_META } from "./statusMeta";

/** Pure DTO → UI shapes (AGENTS.md §7). Components never interpret raw DTOs. */

export const CAMERA_MOVE_LABEL = {
  static: "Static",
  "dolly-in": "Dolly in",
  "dolly-out": "Dolly out",
  pan: "Pan",
  "tilt-up": "Tilt up",
  "crane-up": "Crane up",
  orbit: "Orbit",
  handheld: "Handheld",
  "crash-zoom": "Crash zoom",
  fpv: "FPV",
} satisfies Record<CameraMove, string>;

export type FrameState =
  | { kind: "waiting" }
  | { kind: "drawing" }
  | { kind: "failed"; message: string }
  | { kind: "ready"; url: string; isRedrawing: boolean; redrawFailed: boolean };

const isInFlight = (asset: AssetView | null) =>
  asset !== null && !ASSET_STATUS_META[asset.status].isTerminal;

export function frameState(shot: ShotView): FrameState {
  const { frame, frameJob } = shot;
  if (frame?.status === "succeeded" && frame.url) {
    return {
      kind: "ready",
      url: frame.url,
      isRedrawing: isInFlight(frameJob),
      redrawFailed: frameJob?.status === "failed",
    };
  }
  if (frame?.status === "failed") {
    return { kind: "failed", message: "This frame couldn't be drawn." };
  }
  return frame ? { kind: "drawing" } : { kind: "waiting" };
}

/** True when nothing is in flight, so polling can stop (ADR-013). */
export function isSettled(view: WorkspaceView): boolean {
  if (view.status === "planning") return false;
  if (view.status === "failed") return true;
  const shots = view.directions.flatMap((d) => d.shots);
  const assets = shots.flatMap((s) => [s.frame, s.frameJob, s.video, s.videoJob]);
  if (assets.some(isInFlight)) return false;
  // Planned but frames not ordered yet: the storyboard workflow hasn't created them.
  return !shots.some((s) => s.frame === null && s.frameJob === null);
}

export interface BoardProgress {
  framesReady: number;
  framesTotal: number;
  message: string;
}

export function boardProgress(view: WorkspaceView): BoardProgress {
  const shots = view.directions.flatMap((d) => d.shots);
  const framesReady = shots.filter((s) => frameState(s).kind === "ready").length;
  const framesTotal = shots.length;

  const message =
    view.status === "planning"
      ? "The Director is writing three directions…"
      : view.status === "failed"
        ? "The Director couldn't finish this plan."
        : framesReady < framesTotal
          ? `Drawing storyboards: ${String(framesReady)} of ${String(framesTotal)} frames ready`
          : view.selectedDirectionId
            ? "Direction chosen. Refine the shots, then produce."
            : "Storyboards ready. Pick the direction you like best.";

  return { framesReady, framesTotal, message };
}

import type { AspectRatio } from "@/contracts/brief";
import { shotFilename, type ShotView, type WorkspaceView } from "@/contracts/project";
import { apiUrl } from "@/shared/lib/apiClient";

import { ASSET_STATUS_META, type Tone } from "./statusMeta";
import { CAMERA_MOVE_LABEL, frameState } from "./viewModels";

/** Production view models: the chosen direction becomes a film of playable shots (the Studio). */

export type VideoState =
  | { kind: "waiting" }
  | { kind: "rendering" }
  | { kind: "failed"; assetId: string }
  | { kind: "ready"; url: string; assetId: string };

export function videoState(shot: ShotView): VideoState {
  const { video } = shot;
  if (!video) return { kind: "waiting" };
  if (video.status === "succeeded" && video.url) {
    return { kind: "ready", url: video.url, assetId: video.id };
  }
  if (video.status === "failed") return { kind: "failed", assetId: video.id };
  return { kind: "rendering" };
}

/** The chosen direction's shots, in order: the film. */
export function filmShots(view: WorkspaceView): ShotView[] {
  return view.directions.find((d) => d.id === view.selectedDirectionId)?.shots ?? [];
}

export interface ProductionProgress {
  ready: number;
  failed: number;
  inFlight: number;
  total: number;
  message: string;
}

export function productionProgress(view: WorkspaceView): ProductionProgress {
  const kinds = filmShots(view).map((shot) => videoState(shot).kind);
  const ready = kinds.filter((kind) => kind === "ready").length;
  const failed = kinds.filter((kind) => kind === "failed").length;
  const counts = { ready, failed, inFlight: kinds.length - ready - failed, total: kinds.length };
  return { ...counts, message: productionMessage(counts) };
}

function productionMessage({
  ready,
  failed,
  inFlight,
  total,
}: Omit<ProductionProgress, "message">) {
  if (total > 0 && ready === total) return "Your film is ready. Press play to watch it.";
  const tally = `${String(ready)} of ${String(total)} shots ready`;
  if (inFlight > 0) {
    // Kling v3 Pro renders the shots side by side in about 8 minutes (ADR-026): say so, so a long
    // wait doesn't read as stuck.
    return `Rendering your film (about 8 minutes): ${tally}${failed > 0 ? `, ${String(failed)} failed` : ""}`;
  }
  // Layout-neutral: the shot list sits beside the player on wide screens and below it on phones.
  const failures =
    failed === 1
      ? "1 shot failed and was refunded. Retry it"
      : `${String(failed)} shots failed and were refunded. Retry them`;
  return `${tally}. ${failures} from the shot list.`;
}

export interface FilmShot {
  id: string;
  number: number;
  title: string;
  description: string;
  /** Camera move and duration, e.g. "Dolly in · 5s". */
  recipe: string;
  durationS: number;
  /** The storyboard frame the video starts from, shown until the video plays. */
  posterUrl: string | null;
  video: VideoState;
  status: { label: string; tone: Tone };
  /** Once the video exists: a same-origin link that downloads it, and a friendly filename. */
  download: { href: string; filename: string } | null;
}

export interface Film {
  projectId: string;
  directionName: string;
  aspectRatio: AspectRatio;
  /** The owner can retry failed shots; everyone else watches (e.g. the public demo). */
  canManage: boolean;
  shots: FilmShot[];
  progress: ProductionProgress;
}

const WAITING_STATUS = { label: "Waiting", tone: "muted" } as const;

export function toFilm(view: WorkspaceView): Film {
  const direction = view.directions.find((d) => d.id === view.selectedDirectionId);
  return {
    projectId: view.id,
    directionName: direction?.name ?? "",
    aspectRatio: view.aspectRatio,
    canManage: view.isOwner && !view.isDemo,
    shots: (direction?.shots ?? []).map((shot, index) => toFilmShot(view, shot, index + 1)),
    progress: productionProgress(view),
  };
}

function toFilmShot(view: WorkspaceView, shot: ShotView, number: number): FilmShot {
  const frame = frameState(shot);
  const video = videoState(shot);
  return {
    id: shot.id,
    number,
    title: shot.title,
    description: shot.description,
    recipe: `${CAMERA_MOVE_LABEL[shot.cameraMove]} · ${String(shot.durationS)}s`,
    durationS: shot.durationS,
    posterUrl: frame.kind === "ready" ? frame.url : null,
    video,
    status: shot.video ? ASSET_STATUS_META[shot.video.status] : WAITING_STATUS,
    download:
      video.kind === "ready"
        ? {
            href: apiUrl(
              `/projects/${encodeURIComponent(view.id)}/assets/${encodeURIComponent(video.assetId)}/download`,
            ),
            filename: shotFilename(view.title, number, video.url),
          }
        : null,
  };
}

export interface ProduceReadiness {
  shotCount: number;
  /** Shots edited since their frame was drawn: producing uses the frame as it is. */
  staleCount: number;
  /** Why production can't start yet, or null when it can. */
  blocker: string | null;
}

export function produceReadiness(view: WorkspaceView): ProduceReadiness {
  const shots = filmShots(view);
  const frames = shots.map(frameState);
  const isDrawing = frames.some(
    (f) => f.kind === "waiting" || f.kind === "drawing" || (f.kind === "ready" && f.isRedrawing),
  );
  const failed = frames.filter((f) => f.kind === "failed").length;
  const blocker = isDrawing
    ? "Waiting for the storyboard frames to finish."
    : failed === 1
      ? "A frame couldn't be drawn. Redraw it before producing."
      : failed > 1
        ? `${String(failed)} frames couldn't be drawn. Redraw them before producing.`
        : null;
  return { shotCount: shots.length, staleCount: shots.filter((s) => s.frameStale).length, blocker };
}

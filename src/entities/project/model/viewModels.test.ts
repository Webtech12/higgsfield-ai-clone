import { describe, expect, it } from "vitest";

import type { AssetView, ShotView, WorkspaceView } from "@/contracts/project";

import { boardProgress, frameState, isSettled } from "./viewModels";

const asset = (status: AssetView["status"], url: string | null = null): AssetView => ({
  id: `ast_${status}`,
  kind: "frame",
  status,
  version: 1,
  url,
  error: null,
});

const shot = (overrides: Partial<ShotView> = {}): ShotView => ({
  id: "sht_1",
  ordinal: 0,
  title: "Set-up",
  description: "A lighthouse at dusk",
  cameraMove: "dolly-in",
  durationS: 5,
  lighting: "dusk",
  mood: "still",
  frameStale: false,
  frame: null,
  frameJob: null,
  video: null,
  videoJob: null,
  ...overrides,
});

const view = (status: WorkspaceView["status"], shots: ShotView[]): WorkspaceView => ({
  id: "prj_1",
  title: "The Keeper",
  brief: "brief",
  aspectRatio: "16:9",
  styles: [],
  status,
  version: 1,
  selectedDirectionId: null,
  isDemo: false,
  isOwner: true,
  directions: [{ id: "dir_1", ordinal: 0, name: "Quiet", tagline: "t", look: "l", shots }],
});

describe("frameState", () => {
  it("shows a ready frame, flagged while a redraw is in flight", () => {
    const state = frameState(
      shot({ frame: asset("succeeded", "/f.svg"), frameJob: asset("running") }),
    );

    expect(state).toEqual({ kind: "ready", url: "/f.svg", isRedrawing: true, redrawFailed: false });
  });

  it("distinguishes waiting (not ordered), drawing and failed", () => {
    expect(frameState(shot()).kind).toBe("waiting");
    expect(frameState(shot({ frame: asset("submitted") })).kind).toBe("drawing");
    expect(frameState(shot({ frame: asset("failed") })).kind).toBe("failed");
  });
});

describe("isSettled", () => {
  it("keeps polling while planning", () => {
    expect(isSettled(view("planning", []))).toBe(false);
  });

  it("keeps polling while any asset is in flight", () => {
    expect(isSettled(view("planned", [shot({ frame: asset("running") })]))).toBe(false);
  });

  it("keeps polling when planned but frames are not ordered yet", () => {
    expect(isSettled(view("planned", [shot()]))).toBe(false);
  });

  it("stops when every frame is terminal", () => {
    const shots = [shot({ frame: asset("succeeded", "/a.svg") }), shot({ frame: asset("failed") })];

    expect(isSettled(view("planned", shots))).toBe(true);
  });

  it("stops when planning failed", () => {
    expect(isSettled(view("failed", []))).toBe(true);
  });
});

describe("boardProgress", () => {
  it("counts ready frames for the live region", () => {
    const shots = [
      shot({ frame: asset("succeeded", "/a.svg") }),
      shot({ frame: asset("running") }),
    ];

    expect(boardProgress(view("planned", shots))).toMatchObject({
      framesReady: 1,
      framesTotal: 2,
      message: "Drawing storyboards: 1 of 2 frames ready",
    });
  });
});

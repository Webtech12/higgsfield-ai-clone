import { describe, expect, it } from "vitest";

import { asset, shot, view } from "./fixtures";
import { boardProgress, conceptPitch, frameState, isSettled } from "./viewModels";

describe("conceptPitch", () => {
  it("collects a concept's hook, end card and music", () => {
    const [concept] = view("planned", []).directions;
    if (!concept) throw new Error("fixture has a concept");

    expect(conceptPitch(concept)).toEqual({
      hook: "h",
      headline: "Glow in 7 days",
      cta: "Shop now",
      music: "Warm indie pop",
    });
  });

  it("has nothing to show for a film planned before ads", () => {
    const [concept] = view("planned", []).directions;
    if (!concept) throw new Error("fixture has a concept");

    expect(conceptPitch({ ...concept, hook: null, headline: null })).toBeNull();
  });
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

  it("keeps polling while a video renders, and stops when it's done", () => {
    const frame = asset("succeeded", "/a.svg");

    expect(isSettled(view("producing", [shot({ frame, video: asset("running") })]))).toBe(false);
    expect(isSettled(view("ready", [shot({ frame, video: asset("succeeded", "/v.mp4") })]))).toBe(
      true,
    );
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

  it("stops saying 'drawing' once the only missing frame has failed", () => {
    const shots = [shot({ frame: asset("succeeded", "/a.svg") }), shot({ frame: asset("failed") })];

    expect(boardProgress(view("planned", shots)).message).toBe(
      "Storyboards ready. Pick the concept you like best.",
    );
  });
});

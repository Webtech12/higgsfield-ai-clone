import { describe, expect, it } from "vitest";

import { asset, shot, view } from "./fixtures";
import { produceReadiness, productionProgress, toFilm, videoState } from "./production";

const frame = asset("succeeded", "/frame.svg");
const video = (status: Parameters<typeof asset>[0], url: string | null = null) =>
  asset(status, url, "video");

/** A project whose chosen direction is `dir_1` with the given shots. */
const chosen = (status: "selected" | "producing" | "ready", shots: ReturnType<typeof shot>[]) =>
  view(status, shots, { selectedDirectionId: "dir_1" });

describe("videoState", () => {
  it("maps each video lifecycle to what the Studio shows", () => {
    expect(videoState(shot()).kind).toBe("waiting");
    expect(videoState(shot({ video: video("queued") })).kind).toBe("rendering");
    expect(videoState(shot({ video: video("persisting") })).kind).toBe("rendering");
    expect(videoState(shot({ video: video("failed") }))).toEqual({
      kind: "failed",
      assetId: "ast_video_failed",
    });
    expect(videoState(shot({ video: video("succeeded", "/v.webm") }))).toEqual({
      kind: "ready",
      url: "/v.webm",
      assetId: "ast_video_succeeded",
    });
  });
});

describe("productionProgress", () => {
  it("counts rendering shots for the live region", () => {
    const shots = [
      shot({ frame, video: video("succeeded", "/1.webm") }),
      shot({ frame, video: video("running") }),
      shot({ frame, video: video("queued") }),
    ];

    expect(productionProgress(chosen("producing", shots))).toEqual({
      ready: 1,
      failed: 0,
      inFlight: 2,
      total: 3,
      message: "Rendering your ad (about 8 minutes): 1 of 3 shots ready",
    });
  });

  it("says the film is ready when every shot is", () => {
    const shots = [shot({ frame, video: video("succeeded", "/1.webm") })];

    expect(productionProgress(chosen("ready", shots)).message).toBe(
      "Your ad is ready. Press play to watch it.",
    );
  });

  it("tells the owner a failed shot was refunded and can be retried", () => {
    const shots = [
      shot({ frame, video: video("succeeded", "/1.webm") }),
      shot({ frame, video: video("failed") }),
    ];

    expect(productionProgress(chosen("producing", shots)).message).toBe(
      "1 of 2 shots ready. 1 shot failed and was refunded. Retry it from the shot list.",
    );
  });
});

describe("toFilm", () => {
  it("turns the chosen direction into numbered, playable shots", () => {
    const film = toFilm(
      chosen("producing", [
        shot({ id: "a", frame, video: video("succeeded", "/clip.webm") }),
        shot({ id: "b", frame, cameraMove: "crash-zoom", durationS: 8 }),
      ]),
    );

    expect(film).toMatchObject({
      projectId: "prj_1",
      directionName: "Real Talk",
      canManage: true,
    });
    expect(film.shots[0]).toMatchObject({
      number: 1,
      recipe: "Dolly in · 5s",
      posterUrl: "/frame.svg",
      status: { label: "Ready", tone: "success" },
      // Same-origin, so the `download` attribute works; the route redirects to the stored file.
      download: {
        href: "/api/v1/projects/prj_1/assets/ast_video_succeeded/download",
        filename: "luma-ugc-testimonial-shot-1.webm",
      },
    });
    expect(film.shots[1]).toMatchObject({
      number: 2,
      recipe: "Crash zoom · 8s",
      status: { label: "Waiting", tone: "muted" },
      download: null,
    });
  });

  it("lets only the owner manage a film, never on the demo", () => {
    expect(toFilm(view("ready", [], { isOwner: false })).canManage).toBe(false);
    expect(toFilm(view("ready", [], { isDemo: true })).canManage).toBe(false);
  });
});

describe("produceReadiness", () => {
  it("is ready when every chosen shot has a frame, and counts out-of-date frames", () => {
    const shots = [shot({ frame }), shot({ frame, frameStale: true })];

    expect(produceReadiness(chosen("selected", shots))).toEqual({
      shotCount: 2,
      staleCount: 1,
      blocker: null,
    });
  });

  it("waits while a frame is still drawing or redrawing", () => {
    const redrawing = shot({ frame, frameJob: asset("running") });

    expect(produceReadiness(chosen("selected", [redrawing])).blocker).toBe(
      "Waiting for the storyboard frames to finish.",
    );
  });

  it("asks for a redraw when a frame failed", () => {
    expect(produceReadiness(chosen("selected", [shot({ frame: asset("failed") })])).blocker).toBe(
      "A frame couldn't be drawn. Redraw it before producing.",
    );
  });
});

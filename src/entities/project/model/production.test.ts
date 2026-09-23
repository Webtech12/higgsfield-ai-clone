import { describe, expect, it } from "vitest";

import { asset, shot, view } from "./fixtures";
import {
  downloadName,
  produceReadiness,
  productionProgress,
  toFilm,
  videoState,
} from "./production";

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
      message: "Rendering your film: 1 of 3 shots ready",
    });
  });

  it("says the film is ready when every shot is", () => {
    const shots = [shot({ frame, video: video("succeeded", "/1.webm") })];

    expect(productionProgress(chosen("ready", shots)).message).toBe(
      "Your film is ready. Press play to watch it.",
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

    expect(film).toMatchObject({ projectId: "prj_1", directionName: "Quiet", canManage: true });
    expect(film.shots[0]).toMatchObject({
      number: 1,
      recipe: "Dolly in · 5s",
      posterUrl: "/frame.svg",
      status: { label: "Ready", tone: "success" },
      downloadName: "the-keeper-shot-1.webm",
    });
    expect(film.shots[1]).toMatchObject({
      number: 2,
      recipe: "Crash zoom · 8s",
      status: { label: "Waiting", tone: "muted" },
      downloadName: null,
    });
  });

  it("lets only the owner manage a film, never on the demo", () => {
    expect(toFilm(view("ready", [], { isOwner: false })).canManage).toBe(false);
    expect(toFilm(view("ready", [], { isDemo: true })).canManage).toBe(false);
  });
});

describe("downloadName", () => {
  it("slugs the title and keeps the clip's real extension", () => {
    expect(downloadName("Salt & Static: Part II", 3, "https://cdn/x/clip.MP4?sig=1")).toBe(
      "salt-static-part-ii-shot-3.mp4",
    );
    expect(downloadName("!!!", 1, "/clip")).toBe("film-shot-1.mp4");
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

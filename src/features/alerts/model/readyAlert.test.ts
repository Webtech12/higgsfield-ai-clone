import { describe, expect, it } from "vitest";

import type { AssetView, ShotView, WorkspaceView } from "@/contracts/project";

import { arrivalOf, isWaiting, phaseOf, titlePrefix } from "./readyAlert";

const asset = (status: AssetView["status"], kind: AssetView["kind"] = "frame"): AssetView => ({
  id: `ast_${kind}_${status}`,
  kind,
  status,
  version: 1,
  url: status === "succeeded" ? `https://cdn.test/${kind}.jpg` : null,
  error: null,
  createdAt: "2026-10-06T12:00:00Z",
});

const shot = (overrides: Partial<ShotView> = {}): ShotView => ({
  id: "sht_1",
  ordinal: 0,
  title: "Hook",
  description: "Close-up of the product",
  motion: "She lifts the bottle",
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

const view = (
  status: WorkspaceView["status"],
  shots: ShotView[],
  overrides: Partial<WorkspaceView> = {},
): WorkspaceView => ({
  id: "prj_1",
  title: "LUMA · UGC testimonial",
  brief: "UGC testimonial for LUMA",
  ad: null,
  cast: null,
  references: [],
  aspectRatio: "9:16",
  styles: [],
  status,
  version: 1,
  selectedDirectionId: null,
  isDemo: false,
  isOwner: true,
  directions: [
    {
      id: "dir_1",
      ordinal: 0,
      name: "Real Talk",
      tagline: "t",
      look: "l",
      hook: "h",
      headline: "Glow in 7 days",
      cta: "Shop now",
      musicBrief: "Warm indie pop",
      shots,
    },
  ],
  ...overrides,
});

const framed = shot({ frame: asset("succeeded") });
const drawing = shot({ id: "sht_2", frame: asset("running") });
const chosen = { selectedDirectionId: "dir_1" };
const rendered = shot({ frame: asset("succeeded"), video: asset("succeeded", "video") });
const rendering = shot({
  id: "sht_2",
  frame: asset("succeeded"),
  video: asset("running", "video"),
});
const renderFailed = shot({
  id: "sht_3",
  frame: asset("succeeded"),
  video: asset("failed", "video"),
});

describe("phaseOf", () => {
  it("follows an ad from its brief to the finished film", () => {
    expect(phaseOf(view("planning", []))).toBe("planning");
    expect(phaseOf(view("planned", [framed, drawing]))).toBe("drawing");
    expect(phaseOf(view("planned", [framed]))).toBe("concepts-ready");
    expect(phaseOf(view("selected", [framed], chosen))).toBe("chosen");
    expect(phaseOf(view("producing", [rendered, rendering], chosen))).toBe("rendering");
    expect(phaseOf(view("ready", [rendered], chosen))).toBe("ad-ready");
  });

  it("needs attention when planning fails or a shot didn't render", () => {
    expect(phaseOf(view("failed", []))).toBe("needs-attention");
    expect(phaseOf(view("producing", [rendered, renderFailed], chosen))).toBe("needs-attention");
  });

  it("treats a failed frame as settled: its card shows the redraw", () => {
    const failedFrame = shot({ frame: asset("failed") });
    expect(phaseOf(view("planned", [framed, failedFrame]))).toBe("concepts-ready");
  });
});

describe("titlePrefix", () => {
  it("counts what's done while work is under way", () => {
    expect(titlePrefix(view("planning", []))).toBe("Writing concepts…");
    expect(titlePrefix(view("planned", [framed, drawing]))).toBe("Drawing frames (1/2)");
    expect(titlePrefix(view("producing", [rendered, rendering], chosen))).toBe("Rendering (1/2)");
  });

  it("marks what's ready, and stays quiet while the brand edits a chosen concept", () => {
    expect(titlePrefix(view("planned", [framed]))).toBe("✓ Concepts ready");
    expect(titlePrefix(view("ready", [rendered], chosen))).toBe("✓ Your ad is ready");
    expect(titlePrefix(view("selected", [framed], chosen))).toBeNull();
  });

  it("leaves the example's title alone", () => {
    expect(titlePrefix(view("ready", [rendered], { ...chosen, isDemo: true }))).toBeNull();
  });
});

describe("arrivalOf", () => {
  it("announces concepts and finished ads that arrive while the brand waits", () => {
    expect(arrivalOf("drawing", "concepts-ready")?.title).toBe("Your three concepts are ready");
    expect(arrivalOf("planning", "concepts-ready")?.tone).toBe("success");
    expect(arrivalOf("rendering", "ad-ready")?.title).toBe("Your ad is ready");
  });

  it("announces failures with what to do next", () => {
    expect(arrivalOf("planning", "needs-attention")?.tone).toBe("danger");
    expect(arrivalOf("rendering", "needs-attention")?.body).toMatch(/refunded/);
  });

  it("says nothing on first load, without a change, or for the brand's own choices", () => {
    expect(arrivalOf(null, "ad-ready")).toBeNull();
    expect(arrivalOf("rendering", "rendering")).toBeNull();
    expect(arrivalOf("concepts-ready", "chosen")).toBeNull();
    expect(arrivalOf("chosen", "rendering")).toBeNull();
  });
});

describe("isWaiting", () => {
  it("is true only while something is being made", () => {
    expect(isWaiting("planning")).toBe(true);
    expect(isWaiting("rendering")).toBe(true);
    expect(isWaiting("concepts-ready")).toBe(false);
    expect(isWaiting("needs-attention")).toBe(false);
  });
});

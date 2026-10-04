import { describe, expect, it } from "vitest";

import { createRoutingModule } from "./index";

describe("selectModel", () => {
  const fake = createRoutingModule({ provider: "fake" });
  const fal = createRoutingModule({ provider: "fal" });

  it("draws frames from reference photos when there are some, from text when there are none", () => {
    expect(fal.selectModel({ kind: "frame", references: 4 }).id).toBe(
      "fal-ai/nano-banana-pro/edit",
    );
    expect(fal.selectModel({ kind: "frame" }).id).toBe("fal-ai/nano-banana-pro");
    expect(fake.selectModel({ kind: "frame", references: 5 }).id).toBe("fake/storyboard-frame");
  });

  it("never picks a model that can't take that many references", () => {
    expect(() => fal.selectModel({ kind: "frame", references: 9 })).toThrow(/9 reference photos/);
  });

  it("animates with Kling v3 Pro (ADR-026)", () => {
    expect(fal.selectModel({ kind: "video" }).id).toBe("fal-ai/kling-video/v3/pro/image-to-video");
  });

  it("never picks a retired model, but still prices the assets it made", () => {
    for (const retired of [
      "fal-ai/bytedance/seedream/v4.5/edit",
      "minimax/h3-max/image-to-video",
      "fal-ai/bytedance/seedance/v1/lite/image-to-video",
    ]) {
      expect(fal.models().find((m) => m.id === retired)?.isRetired).toBe(true);
    }
    expect(fal.priceOf("minimax/h3-max/image-to-video")).toBe(10);
    expect(fal.estimateCents("fal-ai/bytedance/seedream/v4.5/edit")).toBe(4);
  });

  it("prices video in credits and frames for free (AGENTS.md §1)", () => {
    expect(fal.priceFor({ kind: "video" })).toBe(10);
    expect(fal.priceFor({ kind: "frame" })).toBe(0);
  });

  it("counts a Kling shot at its longest length against the kill-switch", () => {
    // $0.14 a second × 6 s, the longest shot the Director plans.
    expect(fal.estimateCents("fal-ai/kling-video/v3/pro/image-to-video")).toBe(84);
  });
});

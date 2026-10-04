import { describe, expect, it } from "vitest";

import { createRoutingModule } from "./index";

describe("selectModel", () => {
  const fake = createRoutingModule({ provider: "fake" });
  const fal = createRoutingModule({ provider: "fal" });

  it("draws frames from reference photos when there are some, from text when there are none", () => {
    expect(fal.selectModel({ kind: "frame", references: 4 }).id).toBe(
      "fal-ai/bytedance/seedream/v4.5/edit",
    );
    expect(fal.selectModel({ kind: "frame" }).id).toBe(
      "fal-ai/bytedance/seedream/v4.5/text-to-image",
    );
    expect(fake.selectModel({ kind: "frame", references: 5 }).id).toBe("fake/storyboard-frame");
  });

  it("never picks a model that can't take that many references", () => {
    expect(() => fal.selectModel({ kind: "frame", references: 11 })).toThrow(/11 reference photos/);
  });

  it("never picks a retired model, but still prices the assets it made", () => {
    expect(fal.selectModel({ kind: "video" }).id).toBe("minimax/h3-max/image-to-video");
    expect(fal.priceOf("fal-ai/bytedance/seedance/v1/lite/image-to-video")).toBe(10);
  });

  it("prices video in credits and frames for free (AGENTS.md §1)", () => {
    expect(fal.priceFor({ kind: "video" })).toBe(10);
    expect(fal.priceFor({ kind: "frame" })).toBe(0);
  });
});

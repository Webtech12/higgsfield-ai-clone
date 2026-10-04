import { describe, expect, it } from "vitest";

import { createRoutingModule } from "./index";

describe("selectModel", () => {
  const fake = createRoutingModule({ provider: "fake" });
  const fal = createRoutingModule({ provider: "fal" });

  it("picks a frame model that takes the number of reference photos sent", () => {
    expect(fake.selectModel({ kind: "frame", references: 5 }).id).toBe("fake/storyboard-frame");
    expect(fal.selectModel({ kind: "frame" }).references.min).toBe(0);
  });

  it("never picks a model that can't take that many references", () => {
    expect(() => fal.selectModel({ kind: "frame", references: 11 })).toThrow(/11 reference photos/);
  });

  it("prices video in credits and frames for free (AGENTS.md §1)", () => {
    expect(fal.priceFor({ kind: "video" })).toBe(10);
    expect(fal.priceFor({ kind: "frame" })).toBe(0);
  });
});

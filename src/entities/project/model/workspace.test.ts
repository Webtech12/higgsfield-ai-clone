import { describe, expect, it } from "vitest";

import { asset, shot, view } from "./fixtures";
import { progressMessage } from "./workspace";

describe("progressMessage", () => {
  it("narrates the Board while planning and storyboarding", () => {
    expect(progressMessage(view("planning", []))).toBe("The Director is writing three directions…");
  });

  it("narrates the Studio once production starts", () => {
    const rendering = shot({ video: asset("running", null, "video") });

    expect(
      progressMessage(view("producing", [rendering, rendering], { selectedDirectionId: "dir_1" })),
    ).toBe("Rendering your film: 0 of 2 shots ready");
  });
});

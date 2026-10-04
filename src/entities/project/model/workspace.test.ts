import { describe, expect, it } from "vitest";

import { asset, shot, view } from "./fixtures";
import { adHeader, progressMessage } from "./workspace";

describe("adHeader", () => {
  it("shows the format, the product, the cast and the product photos only", () => {
    const header = adHeader(
      view("planned", [], {
        ad: {
          template: "unboxing",
          productName: "Aero Bottle",
          benefit: "Keeps water cold for 24 hours",
          audience: "",
          message: "",
          cta: "",
          moods: [],
          sceneDirection: "",
        },
        cast: { id: "tal_1", name: "Ava", tagline: "Creator", photoUrl: "/ava.jpg" },
        references: [
          { url: "/bottle.jpg", role: "product" },
          { url: "/kitchen.jpg", role: "scene" },
        ],
      }),
    );

    expect(header).toEqual({
      format: "Unboxing",
      productName: "Aero Bottle",
      cast: { id: "tal_1", name: "Ava", tagline: "Creator", photoUrl: "/ava.jpg" },
      productPhotos: ["/bottle.jpg"],
    });
  });

  it("is null for a film made before ads", () => {
    expect(adHeader(view("planned", []))).toBeNull();
  });
});

describe("progressMessage", () => {
  it("narrates the Board while planning and storyboarding", () => {
    expect(progressMessage(view("planning", []))).toBe("The Director is writing three concepts…");
  });

  it("doesn't call the public demo 'your film'", () => {
    const demo = view("ready", [], { selectedDirectionId: "dir_1", isDemo: true, isOwner: false });

    expect(progressMessage(demo)).toBe(
      "Made with Director from the brief above. Press play to watch it.",
    );
  });

  it("narrates the Studio once production starts", () => {
    const rendering = shot({ video: asset("running", null, "video") });

    expect(
      progressMessage(view("producing", [rendering, rendering], { selectedDirectionId: "dir_1" })),
    ).toBe("Rendering your film (about 8 minutes): 0 of 2 shots ready");
  });
});

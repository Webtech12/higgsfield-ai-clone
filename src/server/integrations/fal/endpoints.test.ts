import { describe, expect, it } from "vitest";

import { createRoutingModule } from "@/server/modules/routing";

import { FAL_ENDPOINTS } from "./endpoints";

const withoutFrame = {
  model: "",
  prompt: "A lighthouse at dusk",
  aspectRatio: "9:16" as const,
  seed: "ast_1",
  durationS: 8,
};
const request = { ...withoutFrame, imageUrl: "https://example.com/frame.png" };

describe("fal endpoints", () => {
  it("covers every fal model Smart Select can pick", () => {
    const routing = createRoutingModule({ provider: "fal" });
    for (const kind of ["frame", "video"] as const) {
      expect(FAL_ENDPOINTS[routing.selectModel({ kind }).id]).toBeDefined();
    }
  });

  it("asks Seedream for its smallest frame in the brief's ratio", () => {
    const seedream = FAL_ENDPOINTS["fal-ai/bytedance/seedream/v4/text-to-image"];
    expect(seedream?.input({ ...request, kind: "frame" })).toMatchObject({
      image_size: { width: 720, height: 1280 },
      num_images: 1,
    });
  });

  it("starts Seedance from the frame, at the shot's own length", () => {
    const seedance = FAL_ENDPOINTS["fal-ai/bytedance/seedance/v1/lite/image-to-video"];
    expect(seedance?.input({ ...request, kind: "video" })).toMatchObject({
      image_url: "https://example.com/frame.png",
      duration: "8",
      aspect_ratio: "9:16",
      resolution: "720p",
    });
    expect(() => seedance?.input({ ...withoutFrame, kind: "video" })).toThrow(
      /imageUrl is required/,
    );
  });

  it("uses the same seed for the same asset, so a retry draws the same picture", () => {
    const seedream = FAL_ENDPOINTS["fal-ai/bytedance/seedream/v4/text-to-image"];
    const seedOf = () => seedream?.input({ ...request, kind: "frame" }).seed;
    expect(seedOf()).toBe(seedOf());
  });

  it("reads output URLs and rejects malformed output", () => {
    const seedream = FAL_ENDPOINTS["fal-ai/bytedance/seedream/v4/text-to-image"];
    const seedance = FAL_ENDPOINTS["fal-ai/bytedance/seedance/v1/lite/image-to-video"];
    expect(seedream?.outputUrl({ images: [{ url: "https://fal.media/a.png" }] })).toBe(
      "https://fal.media/a.png",
    );
    expect(seedance?.outputUrl({ video: { url: "https://fal.media/v.mp4" } })).toBe(
      "https://fal.media/v.mp4",
    );
    expect(() => seedream?.outputUrl({ images: [] })).toThrow();
  });
});

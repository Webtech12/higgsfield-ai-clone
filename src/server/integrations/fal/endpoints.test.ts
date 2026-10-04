import { describe, expect, it } from "vitest";

import { createRoutingModule } from "@/server/modules/routing";

import { FAL_ENDPOINTS } from "./endpoints";

const base = {
  model: "",
  prompt: "Close-up: the talent holds the product beside her cheek",
  aspectRatio: "9:16" as const,
  seed: "ast_1",
  durationS: 6,
};
const video = { ...base, kind: "video" as const, imageUrl: "https://example.com/frame.png" };
const references = ["https://cdn/talent.jpg", "https://cdn/product.jpg"];

const endpoint = (id: string) => {
  const found = FAL_ENDPOINTS[id];
  if (!found) throw new Error(`no mapping for ${id}`);
  return found;
};

describe("fal endpoints", () => {
  it("maps every fal model in the registry, retired ones included (their assets can be retried)", () => {
    for (const model of createRoutingModule({ provider: "fal" }).models()) {
      expect(FAL_ENDPOINTS[model.id], model.id).toBeDefined();
    }
  });

  it("sends Seedream 4.5 the reference photos in order, at 2K in the brief's ratio", () => {
    const input = endpoint("fal-ai/bytedance/seedream/v4.5/edit").input({
      ...base,
      kind: "frame",
      referenceImageUrls: references,
    });
    expect(input).toMatchObject({
      image_urls: references,
      image_size: { width: 1440, height: 2560 },
      num_images: 1,
    });
  });

  it("refuses to call the edit model without a reference photo", () => {
    expect(() =>
      endpoint("fal-ai/bytedance/seedream/v4.5/edit").input({ ...base, kind: "frame" }),
    ).toThrow(/reference photos/);
  });

  it("keeps square frames above Seedream 4.5's minimum area", () => {
    const input = endpoint("fal-ai/bytedance/seedream/v4.5/text-to-image").input({
      ...base,
      kind: "frame",
      aspectRatio: "1:1",
    });
    expect(input.image_size).toEqual({ width: 1920, height: 1920 });
  });

  it("starts H3 Max from the frame, at the shot's own length, in 1080p", () => {
    const h3 = endpoint("minimax/h3-max/image-to-video");
    expect(h3.input(video)).toMatchObject({
      image_url: "https://example.com/frame.png",
      duration: 6,
      resolution: "1080P",
    });
    expect(() => h3.input({ ...base, kind: "video" })).toThrow(/imageUrl is required/);
  });

  it("uses the same seed for the same asset, so a retry draws the same picture", () => {
    const seedream = endpoint("fal-ai/bytedance/seedream/v4.5/text-to-image");
    const seedOf = () => seedream.input({ ...base, kind: "frame" }).seed;
    expect(seedOf()).toBe(seedOf());
  });

  it("reads output URLs and rejects malformed output", () => {
    const seedream = endpoint("fal-ai/bytedance/seedream/v4.5/edit");
    const h3 = endpoint("minimax/h3-max/image-to-video");
    expect(seedream.outputUrl({ images: [{ url: "https://fal.media/a.png" }] })).toBe(
      "https://fal.media/a.png",
    );
    expect(h3.outputUrl({ video: { url: "https://fal.media/v.mp4" } })).toBe(
      "https://fal.media/v.mp4",
    );
    expect(() => seedream.outputUrl({ images: [] })).toThrow();
  });
});

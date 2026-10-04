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

  it("sends Nano Banana Pro the reference photos in order, at 2K in the brief's ratio", () => {
    const input = endpoint("fal-ai/nano-banana-pro/edit").input({
      ...base,
      kind: "frame",
      referenceImageUrls: references,
    });
    expect(input).toMatchObject({
      image_urls: references,
      aspect_ratio: "9:16",
      resolution: "2K",
      output_format: "jpeg",
      num_images: 1,
    });
  });

  it("refuses to call the edit model without a reference photo", () => {
    expect(() => endpoint("fal-ai/nano-banana-pro/edit").input({ ...base, kind: "frame" })).toThrow(
      /reference photos/,
    );
  });

  it("draws a brief with no photos from text, in the brief's ratio", () => {
    const input = endpoint("fal-ai/nano-banana-pro").input({
      ...base,
      kind: "frame",
      aspectRatio: "1:1",
    });
    expect(input).toMatchObject({ aspect_ratio: "1:1", resolution: "2K" });
    expect(input).not.toHaveProperty("image_urls");
  });

  it("starts Kling from the frame at the shot's own length, without its own audio", () => {
    const kling = endpoint("fal-ai/kling-video/v3/pro/image-to-video");
    expect(kling.input({ ...video, negativePrompt: "CGI, plastic skin" })).toMatchObject({
      start_image_url: "https://example.com/frame.png",
      duration: "6",
      generate_audio: false,
      negative_prompt: "CGI, plastic skin",
      prompt: base.prompt,
    });
    expect(() => kling.input({ ...base, kind: "video" })).toThrow(/imageUrl is required/);
  });

  it("gives Kling the talent and the product as elements, and names them in the prompt", () => {
    const input = endpoint("fal-ai/kling-video/v3/pro/image-to-video").input({
      ...video,
      elements: [
        {
          role: "talent",
          imageUrls: ["https://cdn/t1.jpg", "https://cdn/t2.jpg", "https://cdn/t3.jpg"],
        },
        { role: "product", imageUrls: ["https://cdn/p1.jpg"] },
      ],
    });
    expect(input.prompt).toBe(`@Element1 is the talent. @Element2 is the product. ${base.prompt}`);
    expect(input.elements).toEqual([
      {
        frontal_image_url: "https://cdn/t1.jpg",
        reference_image_urls: ["https://cdn/t2.jpg", "https://cdn/t3.jpg"],
      },
      // One photo is both the frontal view and the one reference Kling requires.
      { frontal_image_url: "https://cdn/p1.jpg", reference_image_urls: ["https://cdn/p1.jpg"] },
    ]);
  });

  it("still calls the retired models the way they were called, for retries", () => {
    expect(
      endpoint("fal-ai/bytedance/seedream/v4.5/edit").input({
        ...base,
        kind: "frame",
        referenceImageUrls: references,
      }),
    ).toMatchObject({ image_urls: references, image_size: { width: 1440, height: 2560 } });
    expect(endpoint("minimax/h3-max/image-to-video").input(video)).toMatchObject({
      image_url: "https://example.com/frame.png",
      duration: 6,
      resolution: "1080P",
    });
  });

  it("uses the same seed for the same asset, so a retry draws the same picture", () => {
    const nanoBanana = endpoint("fal-ai/nano-banana-pro");
    const seedOf = () => nanoBanana.input({ ...base, kind: "frame" }).seed;
    expect(seedOf()).toBe(seedOf());
  });

  it("reads output URLs and rejects malformed output", () => {
    const frame = endpoint("fal-ai/nano-banana-pro/edit");
    const kling = endpoint("fal-ai/kling-video/v3/pro/image-to-video");
    expect(frame.outputUrl({ images: [{ url: "https://fal.media/a.jpg" }], description: "" })).toBe(
      "https://fal.media/a.jpg",
    );
    expect(kling.outputUrl({ video: { url: "https://fal.media/v.mp4" } })).toBe(
      "https://fal.media/v.mp4",
    );
    expect(() => frame.outputUrl({ images: [] })).toThrow();
  });
});

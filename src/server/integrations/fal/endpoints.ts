import { z } from "zod";

import type { AspectRatio } from "@/contracts/brief";
import type { GenerationRequest } from "@/server/modules/production";

import { hashString } from "../hash";

/**
 * How each approved fal endpoint is called and read: the vendor half of its registry entry. Inputs
 * follow each endpoint's OpenAPI schema; outputs are parsed, because provider responses are a trust
 * boundary (AGENTS.md §8).
 */
export interface FalEndpoint {
  input(request: GenerationRequest): Record<string, unknown>;
  outputUrl(data: unknown): string;
}

/** Seedream 4.0's smallest allowed area (921,600 px) in each ratio (retired, ADR-025). */
const SEEDREAM_4_SIZE = {
  "16:9": { width: 1280, height: 720 },
  "9:16": { width: 720, height: 1280 },
  "1:1": { width: 960, height: 960 },
} satisfies Record<AspectRatio, { width: number; height: number }>;

/**
 * Seedream 4.5's smallest allowed area (2560×1440 px) in each ratio: 2K frames, sharp enough for
 * the video model to start from at 1080p.
 */
const SEEDREAM_45_SIZE = {
  "16:9": { width: 2560, height: 1440 },
  "9:16": { width: 1440, height: 2560 },
  "1:1": { width: 1920, height: 1920 },
} satisfies Record<AspectRatio, { width: number; height: number }>;

const ImagesOutput = z.object({ images: z.array(z.object({ url: z.url() })).min(1) });
const VideoOutput = z.object({ video: z.object({ url: z.url() }) });

/** fal seeds are 32-bit integers; ours are stable strings per asset, so a retry draws the same. */
const seedOf = (request: GenerationRequest) => hashString(request.seed) % 2_147_483_647;

const firstImage = (data: unknown): string => {
  const [image] = ImagesOutput.parse(data).images;
  if (!image) throw new Error("The model returned no image");
  return image.url;
};

const firstFrameOf = (request: GenerationRequest, model: string): string => {
  if (!request.imageUrl) {
    throw new Error(`${model} starts from the storyboard frame, so imageUrl is required`);
  }
  return request.imageUrl;
};

export const FAL_ENDPOINTS: Readonly<Record<string, FalEndpoint>> = {
  "fal-ai/bytedance/seedream/v4.5/edit": {
    input: (request) => {
      if (!request.referenceImageUrls?.length) {
        throw new Error("Seedream 4.5 edit draws from reference photos: send at least one");
      }
      return {
        prompt: request.prompt,
        // In the order the prompt names them: talent, then product, then scene (ADR-024).
        image_urls: request.referenceImageUrls,
        image_size: SEEDREAM_45_SIZE[request.aspectRatio],
        num_images: 1,
        seed: seedOf(request),
        enable_safety_checker: true,
      };
    },
    outputUrl: firstImage,
  },
  "fal-ai/bytedance/seedream/v4.5/text-to-image": {
    input: (request) => ({
      prompt: request.prompt,
      image_size: SEEDREAM_45_SIZE[request.aspectRatio],
      num_images: 1,
      seed: seedOf(request),
      enable_safety_checker: true,
    }),
    outputUrl: firstImage,
  },
  "minimax/h3-max/image-to-video": {
    input: (request) => ({
      prompt: request.prompt,
      // The output canvas follows the first frame, so the frame's ratio is the video's.
      image_url: firstFrameOf(request, "H3 Max"),
      duration: request.durationS ?? 5,
      resolution: "1080P",
      prompt_expansion_mode: "balanced",
      seed: seedOf(request),
      enable_safety_checker: true,
    }),
    outputUrl: (data) => VideoOutput.parse(data).video.url,
  },
  "fal-ai/bytedance/seedream/v4/text-to-image": {
    input: (request) => ({
      prompt: request.prompt,
      image_size: SEEDREAM_4_SIZE[request.aspectRatio],
      num_images: 1,
      seed: seedOf(request),
      enable_safety_checker: true,
    }),
    outputUrl: firstImage,
  },
  "fal-ai/bytedance/seedance/v1/lite/image-to-video": {
    input: (request) => ({
      prompt: request.prompt,
      image_url: firstFrameOf(request, "Seedance"),
      // Every shot length the Director picks (4–8 s) is inside Seedance's 2–12 s range.
      duration: String(request.durationS ?? 5),
      resolution: "720p",
      aspect_ratio: request.aspectRatio,
      seed: seedOf(request),
      enable_safety_checker: true,
    }),
    outputUrl: (data) => VideoOutput.parse(data).video.url,
  },
};

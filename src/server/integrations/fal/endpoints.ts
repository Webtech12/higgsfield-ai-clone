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

/** Seedream's smallest allowed area (921,600 px) in each ratio: plenty for a storyboard frame. */
const SEEDREAM_SIZE = {
  "16:9": { width: 1280, height: 720 },
  "9:16": { width: 720, height: 1280 },
  "1:1": { width: 960, height: 960 },
} satisfies Record<AspectRatio, { width: number; height: number }>;

const ImagesOutput = z.object({ images: z.array(z.object({ url: z.url() })).min(1) });
const VideoOutput = z.object({ video: z.object({ url: z.url() }) });

/** fal seeds are 32-bit integers; ours are stable strings per asset, so a retry draws the same. */
const seedOf = (request: GenerationRequest) => hashString(request.seed) % 2_147_483_647;

export const FAL_ENDPOINTS: Readonly<Record<string, FalEndpoint>> = {
  "fal-ai/bytedance/seedream/v4/text-to-image": {
    input: (request) => ({
      prompt: request.prompt,
      image_size: SEEDREAM_SIZE[request.aspectRatio],
      num_images: 1,
      seed: seedOf(request),
      enable_safety_checker: true,
    }),
    outputUrl: (data) => {
      const [image] = ImagesOutput.parse(data).images;
      if (!image) throw new Error("Seedream returned no image");
      return image.url;
    },
  },
  "fal-ai/bytedance/seedance/v1/lite/image-to-video": {
    input: (request) => {
      if (!request.imageUrl) {
        throw new Error("Seedance starts from the storyboard frame, so imageUrl is required");
      }
      return {
        prompt: request.prompt,
        image_url: request.imageUrl,
        // Every shot length the Director picks (4–8 s) is inside Seedance's 2–12 s range.
        duration: String(request.durationS ?? 5),
        resolution: "720p",
        aspect_ratio: request.aspectRatio,
        seed: seedOf(request),
        enable_safety_checker: true,
      };
    },
    outputUrl: (data) => VideoOutput.parse(data).video.url,
  },
};

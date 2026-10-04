import type { AspectRatio } from "@/contracts/brief";
import type { AssetKind } from "@/contracts/project";

import type { VideoElement } from "../domain/elements";

export interface GenerationRequest {
  kind: AssetKind;
  model: string;
  prompt: string;
  aspectRatio: AspectRatio;
  /** Stable per asset, so a retried submit can be recognised. */
  seed: string;
  /** Image-to-video: the storyboard frame used as the first frame (ADR-017). */
  imageUrl?: string;
  /** Frames: the talent's, product's and scene's photos, in the order the prompt names them. */
  referenceImageUrls?: string[];
  /** Videos: the talent and the product, kept consistent in motion (ADR-026). */
  elements?: VideoElement[];
  /** What the model should avoid, for models that take a negative prompt. */
  negativePrompt?: string;
  durationS?: number;
  /** Short human labels, used only by the fake provider to draw placeholder media. */
  label?: { title: string; subtitle: string };
}

export type ProviderStatus =
  | { state: "queued" }
  | { state: "running" }
  | { state: "completed"; outputUrl: string }
  | { state: "failed"; reason: string };

/** Narrow port over a queue-style provider, polled by the generation workflow (ADR-018). */
export interface MediaProvider {
  submit(request: GenerationRequest): Promise<{ requestId: string }>;
  status(requestId: string, model: string): Promise<ProviderStatus>;
}

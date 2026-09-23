import type { AspectRatio } from "@/contracts/brief";
import type { AssetKind } from "@/contracts/project";

export interface GenerationRequest {
  kind: AssetKind;
  model: string;
  prompt: string;
  aspectRatio: AspectRatio;
  /** Stable per asset, so a retried submit can be recognised. */
  seed: string;
  /** Image-to-video: the storyboard frame used as the first frame (ADR-017). */
  imageUrl?: string;
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

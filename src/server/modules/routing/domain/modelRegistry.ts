import type { AssetKind } from "@/contracts/project";

export type ProviderName = "fake" | "fal";

export interface ModelEntry {
  id: string;
  provider: ProviderName;
  kind: AssetKind;
  /** How many reference photos the model takes: 0 for text only (ADR-024). */
  references: { min: number; max: number };
  /** What the user pays, in credits (AGENTS.md §1): frames are free, a video shot costs 10. */
  creditCost: number;
  /** What the provider charges us, in US cents, for the global daily kill-switch (ADR-016). */
  providerCostCents: number;
  /** Shown in the UI as the reason Smart Select picked it. */
  reason: string;
}

const TEXT_ONLY = { min: 0, max: 0 } as const;

/**
 * The one home for models, capabilities and prices (AGENTS.md §8). The fal entries were approved by
 * the user at the first real-provider run, with IDs and prices checked against fal's model and
 * pricing APIs. Provider costs are estimates for the kill-switch, rounded up so it errs high. Order
 * is the fallback order within a provider and kind.
 */
export const MODEL_REGISTRY: readonly ModelEntry[] = [
  {
    // $0.03 per image. Frames are 1280×720 (or 720×1280, 960×960): Seedream's smallest size,
    // which keeps the Board light.
    id: "fal-ai/bytedance/seedream/v4/text-to-image",
    provider: "fal",
    kind: "frame",
    references: TEXT_ONLY,
    creditCost: 0,
    providerCostCents: 3,
    reason: "Seedream 4.0: cinematic stills the video model animates from",
  },
  {
    // $1 per million tokens; a 720p shot is about $0.09 (4 s) to $0.17 (8 s).
    id: "fal-ai/bytedance/seedance/v1/lite/image-to-video",
    provider: "fal",
    kind: "video",
    references: TEXT_ONLY,
    creditCost: 10,
    providerCostCents: 18,
    reason: "Seedance 1.0 Lite: every shot length from 2 to 12 s, in every aspect ratio",
  },
  {
    id: "fake/storyboard-frame",
    provider: "fake",
    kind: "frame",
    references: { min: 0, max: 10 },
    creditCost: 0,
    providerCostCents: 0,
    reason: "Instant placeholder frames for development",
  },
  {
    id: "fake/image-to-video",
    provider: "fake",
    kind: "video",
    references: TEXT_ONLY,
    creditCost: 10,
    providerCostCents: 0,
    reason: "Placeholder video for development",
  },
];

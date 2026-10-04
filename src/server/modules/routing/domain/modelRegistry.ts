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
  /**
   * Replaced by a newer choice: never picked for new work, but still priced, polled and retried for
   * the assets it already made.
   */
  isRetired?: boolean;
}

const TEXT_ONLY = { min: 0, max: 0 } as const;

/**
 * The one home for models, capabilities and prices (AGENTS.md §8). The fal entries were compared in
 * the model bake-off (ADR-025) and chosen by the user for realism (ADR-026), with IDs and prices
 * checked against fal's model and pricing APIs. Provider costs are estimates for the kill-switch,
 * rounded up so it errs high. Order is the fallback order within a provider and kind.
 */
export const MODEL_REGISTRY: readonly ModelEntry[] = [
  {
    // $0.15 per image at 2K: the most natural skin, light and label text in the bake-off, drawn
    // from the talent's, product's and scene's photos.
    id: "fal-ai/nano-banana-pro/edit",
    provider: "fal",
    kind: "frame",
    // fal documents no maximum; a brief sends at most 8 (3 talent, 3 product, 2 scene).
    references: { min: 1, max: 8 },
    creditCost: 0,
    providerCostCents: 15,
    reason: "Nano Banana Pro: true-to-life frames drawn from your talent's and product's photos",
  },
  {
    // The same model without references, for a brief with no talent and no photos.
    id: "fal-ai/nano-banana-pro",
    provider: "fal",
    kind: "frame",
    references: TEXT_ONLY,
    creditCost: 0,
    providerCostCents: 15,
    reason: "Nano Banana Pro: true-to-life frames from the brief alone",
  },
  {
    // $0.14 per second: 56–84 cents for a 4–6 s shot, about 8 minutes to render. It starts from the
    // storyboard frame, with the talent's and the product's photos as elements so faces and labels
    // hold in motion.
    id: "fal-ai/kling-video/v3/pro/image-to-video",
    provider: "fal",
    kind: "video",
    // Elements: up to 4 photos each of the talent and the product, both optional.
    references: { min: 0, max: 8 },
    creditCost: 10,
    providerCostCents: 84,
    reason: "Kling v3 Pro: lifelike 1080p shots that keep your talent's face and product's label",
  },
  {
    id: "fal-ai/bytedance/seedream/v4.5/edit",
    provider: "fal",
    kind: "frame",
    references: { min: 1, max: 10 },
    creditCost: 0,
    providerCostCents: 4,
    reason: "Seedream 4.5: storyboard frames drawn from your talent's and product's photos",
    isRetired: true,
  },
  {
    id: "fal-ai/bytedance/seedream/v4.5/text-to-image",
    provider: "fal",
    kind: "frame",
    references: TEXT_ONLY,
    creditCost: 0,
    providerCostCents: 4,
    reason: "Seedream 4.5: storyboard frames from the brief alone",
    isRetired: true,
  },
  {
    id: "minimax/h3-max/image-to-video",
    provider: "fal",
    kind: "video",
    references: TEXT_ONLY,
    creditCost: 10,
    providerCostCents: 25,
    reason: "MiniMax H3 Max: 1080p shots that start from your storyboard frames",
    isRetired: true,
  },
  {
    id: "fal-ai/bytedance/seedream/v4/text-to-image",
    provider: "fal",
    kind: "frame",
    references: TEXT_ONLY,
    creditCost: 0,
    providerCostCents: 3,
    reason: "Seedream 4.0: cinematic stills the video model animates from",
    isRetired: true,
  },
  {
    id: "fal-ai/bytedance/seedance/v1/lite/image-to-video",
    provider: "fal",
    kind: "video",
    references: TEXT_ONLY,
    creditCost: 10,
    providerCostCents: 18,
    reason: "Seedance 1.0 Lite: every shot length from 2 to 12 s, in every aspect ratio",
    isRetired: true,
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

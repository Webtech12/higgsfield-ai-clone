import type { AssetKind } from "@/contracts/project";

export type ProviderName = "fake" | "fal";

export interface ModelEntry {
  id: string;
  provider: ProviderName;
  kind: AssetKind;
  /** What the user pays, in credits (AGENTS.md §1): frames are free, a video shot costs 10. */
  creditCost: number;
  /** Shown in the UI as the reason Smart Select picked it. */
  reason: string;
}

/**
 * The one home for models, capabilities and prices (AGENTS.md §8). Real fal entries are added at the
 * first real-provider run, with IDs and prices approved by the user; until then only fakes exist.
 */
export const MODEL_REGISTRY: readonly ModelEntry[] = [
  {
    id: "fake/storyboard-frame",
    provider: "fake",
    kind: "frame",
    creditCost: 0,
    reason: "Instant placeholder frames for development",
  },
  {
    id: "fake/image-to-video",
    provider: "fake",
    kind: "video",
    creditCost: 10,
    reason: "Placeholder video for development",
  },
];

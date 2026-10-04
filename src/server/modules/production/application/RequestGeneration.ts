import type { AspectRatio } from "@/contracts/brief";
import type { AssetKind } from "@/contracts/project";
import type { LimitsApi } from "@/server/modules/limits";
import type { RoutingApi } from "@/server/modules/routing";

import { Asset } from "../domain/Asset";
import type { AssetRepository } from "../infrastructure/AssetRepository";

export interface GenerationOrder {
  projectId: string;
  shotId: string;
  kind: AssetKind;
  prompt: string;
  aspectRatio: AspectRatio;
  durationS?: number;
  /** Video only: the storyboard frame to start from (ADR-017). */
  sourceUrl?: string;
  parentAssetId?: string;
  label: { title: string; subtitle: string };
}

/**
 * Creates a queued asset for free work (storyboard frames and redraws). The caller sends
 * asset/generate.requested once it is committed. Paid videos go through the money path instead.
 */
export class RequestGeneration {
  constructor(
    private readonly d: {
      assets: AssetRepository;
      routing: RoutingApi;
      limits: LimitsApi;
      newId: (prefix: string) => string;
    },
  ) {}

  async execute(order: GenerationOrder): Promise<{ assetId: string }> {
    const model = this.d.routing.selectModel({ kind: order.kind });
    const costCredits = this.d.routing.priceOf(model.id);
    const asset = Asset.create({
      id: this.d.newId("ast"),
      projectId: order.projectId,
      shotId: order.shotId,
      kind: order.kind,
      version: await this.d.assets.nextVersion(order.shotId, order.kind),
      parentAssetId: order.parentAssetId ?? null,
      model: model.id,
      prompt: order.prompt,
      sourceUrl: order.sourceUrl ?? null,
      costCredits,
      meta: {
        aspectRatio: order.aspectRatio,
        label: order.label,
        ...(order.durationS === undefined ? {} : { durationS: order.durationS }),
      },
    });
    await this.d.assets.insert(asset);
    // Free to the user, not to us: count it toward the daily kill-switch (AGENTS.md §1).
    if (costCredits === 0)
      await this.d.limits.recordFreeSpend(this.d.routing.estimateCents(model.id));
    return { assetId: asset.id };
  }
}

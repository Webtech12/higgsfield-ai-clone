import type { AspectRatio } from "@/contracts/brief";
import type { AssetKind } from "@/contracts/project";
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

/** Creates a queued asset. The caller sends asset/generate.requested once it is committed. */
export class RequestGeneration {
  constructor(
    private readonly d: {
      assets: AssetRepository;
      routing: RoutingApi;
      newId: (prefix: string) => string;
    },
  ) {}

  async execute(order: GenerationOrder): Promise<{ assetId: string }> {
    const model = this.d.routing.selectModel({ kind: order.kind });
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
      costCredits: this.d.routing.priceOf(model.id),
      meta: {
        aspectRatio: order.aspectRatio,
        label: order.label,
        ...(order.durationS === undefined ? {} : { durationS: order.durationS }),
      },
    });
    await this.d.assets.insert(asset);
    return { assetId: asset.id };
  }
}

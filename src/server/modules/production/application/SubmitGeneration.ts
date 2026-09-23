import type { AssetRepository } from "../infrastructure/AssetRepository";
import type { MediaProvider } from "../ports/MediaProvider";

/** Sends a queued asset to the provider. Idempotent: an asset past `queued` is left alone. */
export class SubmitGeneration {
  constructor(private readonly d: { assets: AssetRepository; provider: MediaProvider }) {}

  async execute(command: { assetId: string }): Promise<void> {
    const asset = await this.d.assets.get(command.assetId);
    if (asset?.status !== "queued") return;

    const a = asset.toSnapshot();
    const { requestId } = await this.d.provider.submit({
      kind: a.kind,
      model: a.model,
      prompt: a.prompt,
      aspectRatio: a.meta.aspectRatio,
      seed: a.id,
      label: a.meta.label,
      ...(a.sourceUrl ? { imageUrl: a.sourceUrl } : {}),
      ...(a.meta.durationS === undefined ? {} : { durationS: a.meta.durationS }),
    });
    asset.markSubmitted(requestId);
    await this.d.assets.save(asset);
  }
}

import type { AssetKind } from "@/contracts/project";
import type { CreditsApi } from "@/server/modules/credits";
import type { MediaApi } from "@/server/modules/media";
import type { ProjectsApi } from "@/server/modules/projects";
import type { UnitOfWork } from "@/server/platform/db";

import type { Asset } from "../domain/Asset";
import type { AssetRepository } from "../infrastructure/AssetRepository";
import type { MediaProvider, ProviderStatus } from "../ports/MediaProvider";

export type CheckOutcome = "pending" | "done" | "failed";

const EXTENSION = { frame: "png", video: "mp4" } satisfies Record<AssetKind, string>;

/**
 * Settles the money for a terminal asset: capture on success, release on failure. Idempotent (keyed
 * per attempt) and a no-op for free work, so it runs every time a terminal state is observed. A step
 * that crashed after saving the status therefore still settles on its retry.
 */
async function settle(credits: CreditsApi, asset: Asset): Promise<void> {
  const command = { assetId: asset.id, attempt: asset.attempt };
  if (asset.status === "succeeded") await credits.capture(command);
  if (asset.status === "failed") await credits.release(command);
}

/**
 * One poll of the provider. On completion: persist the output (provider URLs expire), mark the asset
 * succeeded and make it the shot's current version. Every save is guarded, so a retried step whose
 * save loses the race simply reports the state it finds.
 */
export class CheckGeneration {
  constructor(
    private readonly d: {
      uow: UnitOfWork;
      assets: AssetRepository;
      provider: MediaProvider;
      media: MediaApi;
      projects: ProjectsApi;
      credits: CreditsApi;
    },
  ) {}

  async execute(command: { assetId: string }): Promise<CheckOutcome> {
    const asset = await this.d.assets.get(command.assetId);
    if (!asset) return "failed";
    if (asset.isTerminal) {
      await settle(this.d.credits, asset);
      return asset.status === "succeeded" ? "done" : "failed";
    }
    const { providerRequestId, model } = asset.toSnapshot();
    if (!providerRequestId) return "pending";
    return this.apply(asset, await this.d.provider.status(providerRequestId, model));
  }

  /** Applies one provider status to an asset that is still in flight. */
  private async apply(asset: Asset, status: ProviderStatus): Promise<CheckOutcome> {
    switch (status.state) {
      case "queued":
        return "pending";
      case "running":
        if (asset.status === "submitted") {
          asset.markRunning();
          await this.d.assets.save(asset);
        }
        return "pending";
      case "failed":
        asset.markFailed(status.reason);
        if (await this.d.assets.save(asset)) await settle(this.d.credits, asset);
        return "failed";
      case "completed":
        return this.complete(asset.id, status.outputUrl);
    }
  }

  private async complete(assetId: string, outputUrl: string): Promise<CheckOutcome> {
    const asset = await this.d.assets.get(assetId);
    if (!asset) return "failed";
    if (asset.status === "submitted" || asset.status === "running") {
      asset.markPersisting();
      await this.d.assets.save(asset);
    }
    const persisting = await this.d.assets.get(assetId);
    if (persisting?.status !== "persisting") {
      return persisting?.status === "succeeded" ? "done" : "failed";
    }

    const a = persisting.toSnapshot();
    const url = await this.d.media.persistFromUrl({
      sourceUrl: outputUrl,
      projectId: a.projectId,
      assetId: a.id,
      extension: EXTENSION[a.kind],
    });
    persisting.markSucceeded(url);
    // The success and the shot's pointer to it commit together: no poll (and no crash in between)
    // can leave a finished asset that its shot doesn't point at.
    const isSaved = await this.d.uow.run(async (tx) => {
      if (!(await this.d.assets.save(persisting, tx))) return false;
      const pointer = { projectId: a.projectId, shotId: a.shotId, kind: a.kind, assetId: a.id };
      await this.d.projects.setCurrentAsset(pointer, tx);
      return true;
    });
    if (isSaved) await settle(this.d.credits, persisting);
    return "done";
  }
}

/** Marks an asset failed when the workflow gives up (timeout or exhausted retries) and refunds it. */
export class FailGeneration {
  constructor(private readonly d: { assets: AssetRepository; credits: CreditsApi }) {}

  async execute(command: { assetId: string; reason: string }): Promise<void> {
    const asset = await this.d.assets.get(command.assetId);
    if (!asset) return;
    if (!asset.isTerminal) {
      asset.markFailed(command.reason);
      if (!(await this.d.assets.save(asset))) return;
    }
    await settle(this.d.credits, asset);
  }
}

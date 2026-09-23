import type { AssetKind } from "@/contracts/project";
import type { MediaApi } from "@/server/modules/media";
import type { ProjectsApi } from "@/server/modules/projects";

import type { AssetRepository } from "../infrastructure/AssetRepository";
import type { MediaProvider } from "../ports/MediaProvider";

export type CheckOutcome = "pending" | "done" | "failed";

const EXTENSION = { frame: "png", video: "mp4" } satisfies Record<AssetKind, string>;

/**
 * One poll of the provider. On completion: persist the output (provider URLs expire), mark the asset
 * succeeded and make it the shot's current version. Every save is guarded, so a retried step whose
 * save loses the race simply reports the state it finds.
 */
export class CheckGeneration {
  constructor(
    private readonly d: {
      assets: AssetRepository;
      provider: MediaProvider;
      media: MediaApi;
      projects: ProjectsApi;
    },
  ) {}

  async execute(command: { assetId: string }): Promise<CheckOutcome> {
    const asset = await this.d.assets.get(command.assetId);
    if (!asset) return "failed";
    if (asset.status === "succeeded") return "done";
    if (asset.status === "failed") return "failed";
    const a = asset.toSnapshot();
    if (!a.providerRequestId) return "pending";

    const status = await this.d.provider.status(a.providerRequestId, a.model);
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
        await this.d.assets.save(asset);
        return "failed";
      case "completed":
        return this.complete(command.assetId, status.outputUrl);
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
    if (persisting?.status !== "persisting")
      return persisting?.status === "succeeded" ? "done" : "failed";

    const a = persisting.toSnapshot();
    const url = await this.d.media.persistFromUrl({
      sourceUrl: outputUrl,
      projectId: a.projectId,
      assetId: a.id,
      extension: EXTENSION[a.kind],
    });
    persisting.markSucceeded(url);
    if (await this.d.assets.save(persisting)) {
      await this.d.projects.setCurrentAsset({
        projectId: a.projectId,
        shotId: a.shotId,
        kind: a.kind,
        assetId: a.id,
      });
    }
    return "done";
  }
}

/** Marks an asset failed when the workflow gives up (timeout or exhausted retries). */
export class FailGeneration {
  constructor(private readonly d: { assets: AssetRepository }) {}

  async execute(command: { assetId: string; reason: string }): Promise<void> {
    const asset = await this.d.assets.get(command.assetId);
    if (!asset || asset.isTerminal) return;
    asset.markFailed(command.reason);
    await this.d.assets.save(asset);
  }
}

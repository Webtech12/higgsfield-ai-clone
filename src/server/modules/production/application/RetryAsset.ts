import type { CreditsApi } from "@/server/modules/credits";
import type { LimitsApi } from "@/server/modules/limits";
import type { ProjectsApi } from "@/server/modules/projects";
import type { RoutingApi } from "@/server/modules/routing";
import type { UnitOfWork } from "@/server/platform/db";
import { NotFoundError } from "@/server/platform/errors";

import { IllegalTransitionError } from "../domain/Asset";
import type { AssetRepository } from "../infrastructure/AssetRepository";

/**
 * A user retries a failed frame or video. Same asset, next attempt (ADR-011): a paid asset reserves
 * again under a new key and counts against the caps again, all in one unit of work.
 */
export class RetryAsset {
  constructor(
    private readonly d: {
      uow: UnitOfWork;
      assets: AssetRepository;
      projects: ProjectsApi;
      credits: CreditsApi;
      limits: LimitsApi;
      routing: RoutingApi;
    },
  ) {}

  async execute(command: {
    userId: string;
    isGuest: boolean;
    projectId: string;
    assetId: string;
  }): Promise<{ assetId: string }> {
    await this.d.projects.assertOwner(command.userId, command.projectId);
    await this.d.limits.assertCanGenerate(command.userId);

    return this.d.uow.run(async (tx) => {
      const asset = await this.d.assets.get(command.assetId, tx);
      const a = asset?.toSnapshot();
      if (!asset || a?.projectId !== command.projectId) throw new NotFoundError("Asset not found");

      asset.requeueForRetry(); // only a failed asset can be retried
      if (a.costCredits > 0) {
        await this.d.limits.recordUsage(tx, {
          userId: command.userId,
          isGuest: command.isGuest,
          videos: a.kind === "video" ? 1 : 0,
          spendCents: this.d.routing.estimateCents(a.model),
        });
        await this.d.credits.reserve(tx, {
          userId: command.userId,
          items: [{ assetId: a.id, attempt: asset.attempt, cost: a.costCredits }],
        });
      }
      if (!(await this.d.assets.save(asset, tx))) {
        throw new IllegalTransitionError("failed", "queued"); // someone else retried it first
      }
      return { assetId: a.id };
    });
  }
}

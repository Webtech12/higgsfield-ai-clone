import type { CreditsApi } from "@/server/modules/credits";
import type { DirectorApi } from "@/server/modules/director";
import type { LimitsApi } from "@/server/modules/limits";
import {
  ProjectNotReadyError,
  type ProjectsApi,
  type ShotContext,
} from "@/server/modules/projects";
import type { RoutingApi } from "@/server/modules/routing";
import type { TalentApi } from "@/server/modules/talent";
import type { Tx, UnitOfWork } from "@/server/platform/db";

import { Asset } from "../domain/Asset";
import { videoElements, type VideoElement } from "../domain/elements";
import type { AssetRepository } from "../infrastructure/AssetRepository";

/**
 * The money path (AGENTS.md §6). In one unit of work: start production (locks the project row),
 * build one video per shot from its current storyboard frame, record the caps, reserve the credits
 * (locks the credit account), insert the assets. Any failure rolls all of it back. The caller sends
 * the generation events after commit (ADR-018).
 */
export class ProduceDirection {
  constructor(
    private readonly d: {
      uow: UnitOfWork;
      assets: AssetRepository;
      projects: ProjectsApi;
      credits: CreditsApi;
      limits: LimitsApi;
      routing: RoutingApi;
      director: DirectorApi;
      talent: TalentApi;
      newId: (prefix: string) => string;
    },
  ) {}

  async execute(command: {
    userId: string;
    isGuest: boolean;
    projectId: string;
  }): Promise<{ assetIds: string[] }> {
    await this.d.limits.assertCanGenerate(command.userId);
    const model = this.d.routing.selectModel({ kind: "video" });
    const cost = this.d.routing.priceOf(model.id);

    const videos = await this.d.uow.run(async (tx) => {
      const shots = await this.d.projects.startProduction(tx, command);
      const elements = await this.elementsFor(shots);
      const created = await this.buildVideos(tx, shots, { modelId: model.id, cost, elements });
      await this.d.limits.recordUsage(tx, {
        userId: command.userId,
        isGuest: command.isGuest,
        videos: created.length,
        spendCents: this.d.routing.estimateCents(model.id) * created.length,
      });
      await this.d.credits.reserve(tx, {
        userId: command.userId,
        items: created.map((video) => ({ assetId: video.id, attempt: video.attempt, cost })),
      });
      for (const video of created) await this.d.assets.insert(video, tx);
      return created;
    });
    return { assetIds: videos.map((video) => video.id) };
  }

  /**
   * The talent's current photos and the product's, kept consistent in motion (ADR-026). Casting is
   * checked again here, so a talent whose consent has ended is never animated (ADR-024).
   */
  private async elementsFor(shots: ShotContext[]): Promise<VideoElement[]> {
    const [first] = shots;
    if (!first) return [];
    const talent = first.talentId ? (await this.d.talent.getCasting(first.talentId)).photoUrls : [];
    const product = first.references.filter((r) => r.role === "product").map((r) => r.url);
    return videoElements({ talent, product });
  }

  private async buildVideos(
    tx: Tx,
    shots: ShotContext[],
    video: { modelId: string; cost: number; elements: VideoElement[] },
  ) {
    const { modelId, cost, elements } = video;
    const frameIds = shots.flatMap((c) =>
      c.shot.currentFrameAssetId ? [c.shot.currentFrameAssetId] : [],
    );
    const frameUrls = await this.d.assets.urlsOf(frameIds, tx);
    const videos: Asset[] = [];
    for (const context of shots) {
      const frameUrl = context.shot.currentFrameAssetId
        ? frameUrls.get(context.shot.currentFrameAssetId)
        : undefined;
      if (!frameUrl) {
        throw new ProjectNotReadyError("Every shot needs a finished storyboard frame first");
      }
      videos.push(
        Asset.create({
          id: this.d.newId("ast"),
          projectId: context.projectId,
          shotId: context.shot.id,
          kind: "video",
          version: await this.d.assets.nextVersion(context.shot.id, "video", tx),
          model: modelId,
          prompt: this.d.director.composeVideoPrompt({
            ...context,
            // The video starts from the frame, which already holds the talent and the product; the
            // prompt only needs to know whether there is a label to keep readable.
            references: {
              talent: context.talentId ? 1 : 0,
              product: context.references.filter((r) => r.role === "product").length,
              scene: 0,
            },
          }),
          // The approved storyboard frame is the video's first frame (ADR-017).
          sourceUrl: frameUrl,
          costCredits: cost,
          meta: {
            aspectRatio: context.aspectRatio,
            durationS: context.shot.durationS,
            ...(elements.length > 0 ? { elements } : {}),
            negativePrompt: this.d.director.composeVideoNegativePrompt(),
            label: { title: context.shot.title, subtitle: context.direction.name },
          },
        }),
      );
    }
    return videos;
  }
}

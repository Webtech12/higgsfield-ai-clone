import type { DirectorApi, ReferenceCounts } from "@/server/modules/director";
import type { ProductionApi } from "@/server/modules/production";
import type { ProjectsApi, ShotContext } from "@/server/modules/projects";
import type { TalentApi } from "@/server/modules/talent";

/** The photos every frame of an ad is drawn from, in the order the prompt names them. */
interface FrameReferences {
  urls: string[];
  counts: ReferenceCounts;
}

/**
 * Orders storyboard frames: all 9 after planning, or one when the owner redraws an edited shot. Each
 * frame is drawn from the talent's and the product's photos (ADR-024). Returns the queued asset ids;
 * the caller sends the generation events once they are committed.
 */
export class GenerateFrames {
  constructor(
    private readonly d: {
      projects: ProjectsApi;
      director: DirectorApi;
      production: ProductionApi;
      talent: TalentApi;
    },
  ) {}

  async execute(command: {
    projectId: string;
    only?: { shotId: string; userId: string };
  }): Promise<{ assetIds: string[] }> {
    const shots = await this.d.projects.getShotContexts(command.projectId, command.only);
    const [first] = shots;
    if (!first) return { assetIds: [] };
    // Casting is checked on every draw, so a talent whose consent ended is never used again.
    const references = await this.referencesFor(first);
    const assetIds: string[] = [];
    for (const context of shots) {
      const { assetId } = await this.d.production.requestGeneration(
        this.order(context, references),
      );
      assetIds.push(assetId);
    }
    return { assetIds };
  }

  private async referencesFor(context: ShotContext): Promise<FrameReferences> {
    const talent = context.talentId
      ? (await this.d.talent.getCasting(context.talentId)).photoUrls
      : [];
    const urlsOf = (role: "product" | "scene") =>
      context.references.filter((r) => r.role === role).map((r) => r.url);
    const product = urlsOf("product");
    const scene = urlsOf("scene");
    return {
      urls: [...talent, ...product, ...scene],
      counts: { talent: talent.length, product: product.length, scene: scene.length },
    };
  }

  private order(context: ShotContext, references: FrameReferences) {
    return {
      projectId: context.projectId,
      shotId: context.shot.id,
      kind: "frame" as const,
      prompt: this.d.director.composeFramePrompt({ ...context, references: references.counts }),
      referenceUrls: references.urls,
      aspectRatio: context.aspectRatio,
      label: { title: context.shot.title, subtitle: context.direction.name },
    };
  }
}

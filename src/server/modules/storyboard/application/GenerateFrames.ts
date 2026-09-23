import type { DirectorApi } from "@/server/modules/director";
import type { ProductionApi } from "@/server/modules/production";
import type { ProjectsApi, ShotContext } from "@/server/modules/projects";

/**
 * Orders storyboard frames: all 9 after planning, or one when the owner redraws an edited shot.
 * Returns the queued asset ids; the caller sends the generation events once they are committed.
 */
export class GenerateFrames {
  constructor(
    private readonly d: { projects: ProjectsApi; director: DirectorApi; production: ProductionApi },
  ) {}

  async execute(command: {
    projectId: string;
    only?: { shotId: string; userId: string };
  }): Promise<{ assetIds: string[] }> {
    const shots = await this.d.projects.getShotContexts(command.projectId, command.only);
    const assetIds: string[] = [];
    for (const context of shots) {
      const { assetId } = await this.d.production.requestGeneration(this.order(context));
      assetIds.push(assetId);
    }
    return { assetIds };
  }

  private order(context: ShotContext) {
    return {
      projectId: context.projectId,
      shotId: context.shot.id,
      kind: "frame" as const,
      prompt: this.d.director.composeFramePrompt(context),
      aspectRatio: context.aspectRatio,
      label: { title: context.shot.title, subtitle: context.direction.name },
    };
  }
}

// storyboard: orders the frames a direction is judged by, and redraws edited shots.
import type { DirectorApi } from "@/server/modules/director";
import type { ProductionApi } from "@/server/modules/production";
import type { ProjectsApi } from "@/server/modules/projects";

import { GenerateFrames } from "./application/GenerateFrames";
import { createFramesGenerateWorkflow } from "./workflows/framesGenerate";

export function createStoryboardModule(deps: {
  projects: ProjectsApi;
  director: DirectorApi;
  production: ProductionApi;
}) {
  const generateFrames = new GenerateFrames(deps);
  const run = generateFrames.execute.bind(generateFrames);

  const api = {
    /** Redraws one shot's frame after an edit. Ownership is checked; returns the new asset id. */
    async redrawFrame(command: {
      userId: string;
      projectId: string;
      shotId: string;
    }): Promise<{ assetId: string }> {
      const { assetIds } = await run({
        projectId: command.projectId,
        only: { shotId: command.shotId, userId: command.userId },
      });
      const [assetId] = assetIds;
      if (!assetId) throw new Error("Redraw produced no frame");
      return { assetId };
    },
  };
  const workflows = [createFramesGenerateWorkflow({ generateFrames: run })];
  return { api, workflows };
}

export type StoryboardApi = ReturnType<typeof createStoryboardModule>["api"];

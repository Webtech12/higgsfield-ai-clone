import type { AssetKind } from "@/contracts/project";

import type { ProjectRepository } from "../infrastructure/ProjectRepository";

/** Called by production when a frame or video finishes: it becomes the shot's current version. */
export class SetCurrentAsset {
  constructor(private readonly d: { repository: ProjectRepository }) {}

  async execute(command: {
    projectId: string;
    shotId: string;
    kind: AssetKind;
    assetId: string;
  }): Promise<void> {
    await this.d.repository.update(command.projectId, (project) => {
      if (command.kind === "frame") project.setCurrentFrame(command.shotId, command.assetId);
      else project.setCurrentVideo(command.shotId, command.assetId);
    });
  }
}

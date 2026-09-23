import type { ShotPatch } from "../domain/Project";
import type { ProjectRepository } from "../infrastructure/ProjectRepository";

import { assertCanEdit } from "./ownership";

export class UpdateShot {
  constructor(private readonly d: { repository: ProjectRepository }) {}

  async execute(command: {
    userId: string;
    projectId: string;
    shotId: string;
    patch: ShotPatch;
  }): Promise<{ frameStale: boolean }> {
    const result = await this.d.repository.update(command.projectId, (project) => {
      assertCanEdit(project, command.userId);
      return project.updateShot(command.shotId, command.patch);
    });
    return { frameStale: result?.frameStale ?? false };
  }
}

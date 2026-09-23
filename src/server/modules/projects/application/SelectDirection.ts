import type { Project } from "../domain/Project";
import type { ProjectRepository } from "../infrastructure/ProjectRepository";

import { assertCanEdit } from "./ownership";

export class SelectDirection {
  constructor(private readonly d: { repository: ProjectRepository }) {}

  async execute(command: {
    userId: string;
    projectId: string;
    directionId: string;
  }): Promise<void> {
    await this.d.repository.update(command.projectId, (project: Project) => {
      assertCanEdit(project, command.userId);
      project.selectDirection(command.directionId);
    });
  }
}

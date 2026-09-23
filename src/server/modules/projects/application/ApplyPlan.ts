import type { DirectorPlan } from "@/contracts/plan";
import { NotFoundError } from "@/server/platform/errors";

import type { ProjectRepository } from "../infrastructure/ProjectRepository";

/** Called by the director's plan workflow; not reachable from the API. */
export class ApplyPlan {
  constructor(
    private readonly d: { repository: ProjectRepository; newId: (prefix: string) => string },
  ) {}

  async execute(command: { projectId: string; plan: DirectorPlan }): Promise<void> {
    const applied = await this.d.repository.update(command.projectId, (project) => {
      project.applyPlan(command.plan, this.d.newId);
      return true;
    });
    if (!applied) throw new NotFoundError(`Project ${command.projectId} not found`);
  }
}

export class FailPlanning {
  constructor(private readonly d: { repository: ProjectRepository }) {}

  async execute(command: { projectId: string }): Promise<void> {
    await this.d.repository.update(command.projectId, (project) => {
      project.failPlanning();
    });
  }
}

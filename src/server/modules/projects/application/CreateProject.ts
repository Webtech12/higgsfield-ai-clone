import type { BriefInput } from "@/contracts/brief";

import { Project } from "../domain/Project";
import type { ProjectRepository } from "../infrastructure/ProjectRepository";

export class CreateProject {
  constructor(
    private readonly d: { repository: ProjectRepository; newId: (prefix: string) => string },
  ) {}

  async execute(command: { userId: string; brief: BriefInput }): Promise<{ projectId: string }> {
    const project = Project.create({
      id: this.d.newId("prj"),
      userId: command.userId,
      brief: command.brief.idea,
      aspectRatio: command.brief.aspectRatio,
      styles: command.brief.styles,
    });
    await this.d.repository.insert(project);
    return { projectId: project.id };
  }
}

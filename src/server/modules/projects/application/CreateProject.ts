import type { AdBriefFields } from "@/contracts/ad";
import type { AspectRatio } from "@/contracts/brief";

import { Project, type ProjectReference } from "../domain/Project";
import type { ProjectRepository } from "../infrastructure/ProjectRepository";

/**
 * A new ad from a brief. The caller (the createAd process) has already checked that the photos are
 * the user's own and that the talent can be cast (ADR-024).
 */
export class CreateProject {
  constructor(
    private readonly d: { repository: ProjectRepository; newId: (prefix: string) => string },
  ) {}

  async execute(command: {
    userId: string;
    ad: AdBriefFields;
    talentId: string | null;
    references: ProjectReference[];
    aspectRatio: AspectRatio;
  }): Promise<{ projectId: string }> {
    const project = Project.create({ id: this.d.newId("prj"), ...command });
    await this.d.repository.insert(project);
    return { projectId: project.id };
  }
}

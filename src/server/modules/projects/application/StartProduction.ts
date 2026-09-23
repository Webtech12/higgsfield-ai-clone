import type { Tx } from "@/server/platform/db";
import { NotFoundError } from "@/server/platform/errors";

import type { ProjectRepository } from "../infrastructure/ProjectRepository";

import { toShotContexts, type ShotContext } from "./GetGenerationContext";
import { assertCanEdit } from "./ownership";

/**
 * Moves the project to `producing` inside the money-path transaction and returns the chosen
 * direction's shots. The project row stays locked until the reservation commits, so a double click
 * can't start production twice.
 */
export class StartProduction {
  constructor(private readonly d: { repository: ProjectRepository }) {}

  async execute(tx: Tx, command: { userId: string; projectId: string }): Promise<ShotContext[]> {
    const shots = await this.d.repository.update(
      command.projectId,
      (project) => {
        assertCanEdit(project, command.userId);
        const selectedIds = new Set(project.startProduction().map((s) => s.id));
        return toShotContexts(project.toSnapshot()).filter((c) => selectedIds.has(c.shot.id));
      },
      tx,
    );
    if (!shots) throw new NotFoundError("Project not found");
    return shots;
  }
}

// projects: projects, directions, shots and their rules. Public API only (AGENTS.md §3).
import type { Database } from "@/server/platform/db";

import { ApplyPlan, FailPlanning } from "./application/ApplyPlan";
import { CreateProject } from "./application/CreateProject";
import { GetGenerationContext } from "./application/GetGenerationContext";
import { SelectDirection } from "./application/SelectDirection";
import { SetCurrentAsset } from "./application/SetCurrentAsset";
import { StartProduction } from "./application/StartProduction";
import { UpdateShot } from "./application/UpdateShot";
import { ProjectRepository } from "./infrastructure/ProjectRepository";

export type { ShotContext } from "./application/GetGenerationContext";
export {
  DirectionAlreadySelectedError,
  ProjectNotReadyError,
  ShotNotEditableError,
} from "./domain/Project";

export function createProjectsModule(deps: { db: Database; newId: (prefix: string) => string }) {
  const repository = new ProjectRepository(deps.db);
  const context = new GetGenerationContext({ repository });
  const createProject = new CreateProject({ repository, newId: deps.newId });
  const applyPlan = new ApplyPlan({ repository, newId: deps.newId });
  const failPlanning = new FailPlanning({ repository });
  const selectDirection = new SelectDirection({ repository });
  const updateShot = new UpdateShot({ repository });
  const setCurrentAsset = new SetCurrentAsset({ repository });
  const startProduction = new StartProduction({ repository });

  return {
    startProduction: startProduction.execute.bind(startProduction),
    assertOwner: context.assertOwner.bind(context),
    createProject: createProject.execute.bind(createProject),
    applyPlan: applyPlan.execute.bind(applyPlan),
    failPlanning: failPlanning.execute.bind(failPlanning),
    selectDirection: selectDirection.execute.bind(selectDirection),
    updateShot: updateShot.execute.bind(updateShot),
    setCurrentAsset: setCurrentAsset.execute.bind(setCurrentAsset),
    getPlanningInput: context.planningInput.bind(context),
    getShotContexts: context.shots.bind(context),
  };
}

export type ProjectsApi = ReturnType<typeof createProjectsModule>;

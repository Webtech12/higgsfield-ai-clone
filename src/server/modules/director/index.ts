// director: plans films from briefs and owns every prompt (AGENTS.md §3, §8). Public API only.
import type { ProjectsApi } from "@/server/modules/projects";

import { PlanProject } from "./application/PlanProject";
import { composeFramePrompt, composeVideoPrompt } from "./domain/PromptComposer";
import type { LLMProvider } from "./ports/LLMProvider";
import { createProjectPlanWorkflow } from "./workflows/projectPlan";

export type { LLMProvider, LLMPurpose, StructuredRequest } from "./ports/LLMProvider";
export type { PromptContext } from "./domain/PromptComposer";

export function createDirectorModule(deps: { llm: LLMProvider; projects: ProjectsApi }) {
  const planProject = new PlanProject(deps);
  const api = {
    planProject: planProject.execute.bind(planProject),
    composeFramePrompt,
    composeVideoPrompt,
  };
  const workflows = [
    createProjectPlanWorkflow({
      planProject: api.planProject,
      failPlanning: deps.projects.failPlanning,
    }),
  ];
  return { api, workflows };
}

export type DirectorApi = ReturnType<typeof createDirectorModule>["api"];

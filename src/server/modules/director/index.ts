// director: plans ads from briefs, coaches briefs and owns every prompt (AGENTS.md §3, §8).
import type { ProjectsApi } from "@/server/modules/projects";
import type { TalentApi } from "@/server/modules/talent";

import { CoachBrief } from "./application/CoachBrief";
import { PlanProject } from "./application/PlanProject";
import { composeFramePrompt, composeVideoPrompt } from "./domain/PromptComposer";
import type { LLMProvider } from "./ports/LLMProvider";
import { createProjectPlanWorkflow } from "./workflows/projectPlan";

export type { LLMProvider, LLMPurpose, StructuredRequest } from "./ports/LLMProvider";
export type { PromptContext, ReferenceCounts } from "./domain/PromptComposer";
export { CoachRequest, PlanningRequest } from "./domain/requests";

export function createDirectorModule(deps: {
  llm: LLMProvider;
  projects: ProjectsApi;
  talent: TalentApi;
}) {
  const planProject = new PlanProject(deps);
  const coachBrief = new CoachBrief(deps);
  const api = {
    planProject: planProject.execute.bind(planProject),
    coachBrief: coachBrief.execute.bind(coachBrief),
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

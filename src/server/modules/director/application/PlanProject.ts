import { DirectorPlan } from "@/contracts/plan";
import type { ProjectsApi } from "@/server/modules/projects";
import type { TalentApi } from "@/server/modules/talent";

import { AD_DIRECTOR_SYSTEM_PROMPT, PLAN_REPAIR_HINT } from "../domain/prompts";
import { templateContext, type PlanningRequest } from "../domain/requests";
import type { LLMProvider } from "../ports/LLMProvider";

/** Ad brief → three concepts → applied to the project. One repair retry on invalid output. */
export class PlanProject {
  constructor(private readonly d: { llm: LLMProvider; projects: ProjectsApi; talent: TalentApi }) {}

  async execute(command: { projectId: string }): Promise<void> {
    const input = JSON.stringify(await this.request(command.projectId));

    let plan: DirectorPlan;
    try {
      plan = await this.plan(input, AD_DIRECTOR_SYSTEM_PROMPT);
    } catch {
      plan = await this.plan(input, `${AD_DIRECTOR_SYSTEM_PROMPT}\n\n${PLAN_REPAIR_HINT}`);
    }
    await this.d.projects.applyPlan({ projectId: command.projectId, plan });
  }

  private async request(projectId: string): Promise<PlanningRequest> {
    const brief = await this.d.projects.getPlanningInput(projectId);
    // The persona only: the talent's photos go to the frame model, their name to no prompt.
    const cast = brief.talentId ? await this.d.talent.getCasting(brief.talentId) : null;
    return {
      template: templateContext(brief.ad.template),
      brief: brief.ad,
      aspectRatio: brief.aspectRatio,
      talent: cast ? { persona: cast.persona } : null,
      photos: brief.photos,
    };
  }

  private async plan(input: string, system: string): Promise<DirectorPlan> {
    const raw = await this.d.llm.structured({
      purpose: "plan",
      system,
      input,
      schema: DirectorPlan,
    });
    // The provider already enforced the schema; parsing again keeps LLM output a trust boundary.
    return DirectorPlan.parse(raw);
  }
}

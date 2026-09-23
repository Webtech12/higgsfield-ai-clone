import { DirectorPlan } from "@/contracts/plan";
import type { ProjectsApi } from "@/server/modules/projects";

import { DIRECTOR_SYSTEM_PROMPT, PLAN_REPAIR_HINT } from "../domain/prompts";
import type { LLMProvider } from "../ports/LLMProvider";

/** Brief → structured plan → applied to the project. One repair retry on invalid output. */
export class PlanProject {
  constructor(private readonly d: { llm: LLMProvider; projects: ProjectsApi }) {}

  async execute(command: { projectId: string }): Promise<void> {
    const brief = await this.d.projects.getPlanningInput(command.projectId);
    const input = JSON.stringify(brief);

    let plan: DirectorPlan;
    try {
      plan = await this.request(input, DIRECTOR_SYSTEM_PROMPT);
    } catch {
      plan = await this.request(input, `${DIRECTOR_SYSTEM_PROMPT}\n\n${PLAN_REPAIR_HINT}`);
    }
    await this.d.projects.applyPlan({ projectId: command.projectId, plan });
  }

  private async request(input: string, system: string): Promise<DirectorPlan> {
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

import "server-only";

import { inngest, projectCreated, projectPlanned } from "@/server/platform/inngest";

/** project/created → plan with the LLM → project/planned (docs/architecture.md §7.3). */
export function createProjectPlanWorkflow(deps: {
  planProject: (command: { projectId: string }) => Promise<void>;
  failPlanning: (command: { projectId: string }) => Promise<void>;
}) {
  return inngest.createFunction(
    {
      id: "project-plan",
      triggers: [projectCreated],
      retries: 2,
      onFailure: async ({ event, step }) => {
        // The failure payload is untyped in inngest v4: parse it with the event's own schema.
        const { projectId } = projectCreated.schema.parse(event.data.event.data);
        await step.run("mark-planning-failed", () => deps.failPlanning({ projectId }));
      },
    },
    async ({ event, step }) => {
      const { projectId } = event.data;
      await step.run("plan", () => deps.planProject({ projectId }));
      await step.sendEvent("planned", projectPlanned.create({ projectId }));
    },
  );
}

import "server-only";

import { assetGenerateRequested, inngest, projectPlanned } from "@/server/platform/inngest";

/** project/planned → order the 9 storyboard frames → one asset/generate.requested each. */
export function createFramesGenerateWorkflow(deps: {
  generateFrames: (command: { projectId: string }) => Promise<{ assetIds: string[] }>;
}) {
  return inngest.createFunction(
    { id: "frames-generate", triggers: [projectPlanned], retries: 2 },
    async ({ event, step }) => {
      const { assetIds } = await step.run("order-frames", () =>
        deps.generateFrames({ projectId: event.data.projectId }),
      );
      await step.sendEvent(
        "generate-frames",
        assetIds.map((assetId) => assetGenerateRequested.create({ assetId })),
      );
      return { assetIds };
    },
  );
}

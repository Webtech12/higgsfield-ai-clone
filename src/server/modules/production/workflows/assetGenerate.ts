import "server-only";

import { GENERATION_POLICY } from "@/server/platform/config/resilience";
import { assetGenerateRequested, inngest } from "@/server/platform/inngest";

import type { CheckOutcome } from "../application/CheckGeneration";

/**
 * asset/generate.requested → submit → poll until done or timed out (ADR-018: polling, no webhooks).
 * One run per asset at a time, so a duplicate event can't double-submit.
 */
export function createAssetGenerateWorkflow(deps: {
  submit: (command: { assetId: string }) => Promise<void>;
  check: (command: { assetId: string }) => Promise<CheckOutcome>;
  fail: (command: { assetId: string; reason: string }) => Promise<void>;
}) {
  return inngest.createFunction(
    {
      id: "asset-generate",
      triggers: [assetGenerateRequested],
      retries: GENERATION_POLICY.workflowRetries,
      concurrency: [{ key: "event.data.assetId", limit: 1 }],
      onFailure: async ({ event, step }) => {
        // The failure payload is untyped in inngest v4: parse it with the event's own schema.
        const { assetId } = assetGenerateRequested.schema.parse(event.data.event.data);
        await step.run("mark-failed", () =>
          deps.fail({ assetId, reason: "Generation could not be completed" }),
        );
      },
    },
    async ({ event, step }) => {
      const { assetId } = event.data;
      await step.run("submit", () => deps.submit({ assetId }));

      for (let poll = 0; poll < GENERATION_POLICY.maxPolls; poll++) {
        await step.sleep(`wait-${String(poll)}`, GENERATION_POLICY.pollInterval);
        const outcome = await step.run(`check-${String(poll)}`, () => deps.check({ assetId }));
        if (outcome !== "pending") return { assetId, outcome };
      }

      await step.run("time-out", () =>
        deps.fail({ assetId, reason: "The provider took too long" }),
      );
      return { assetId, outcome: "failed" as const };
    },
  );
}

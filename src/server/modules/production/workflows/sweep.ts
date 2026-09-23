import "server-only";

import { SWEEP_POLICY } from "@/server/platform/config/resilience";
import { assetGenerateRequested, inngest } from "@/server/platform/inngest";

/**
 * The lean core's safety net (ADR-018): events are sent after commit, so one can be lost. Once a
 * minute, re-send the generation event for any asset still queued well after it was created. The
 * asset-generate workflow is idempotent, so a duplicate is harmless.
 */
export function createSweepWorkflow(deps: { queuedSince: (before: Date) => Promise<string[]> }) {
  return inngest.createFunction(
    { id: "production-sweep", triggers: [{ cron: SWEEP_POLICY.cron }] },
    async ({ step }) => {
      const stuck = await step.run("find-stuck-assets", () =>
        deps.queuedSince(new Date(Date.now() - SWEEP_POLICY.queuedGraceMs)),
      );
      if (stuck.length > 0) {
        await step.sendEvent(
          "resend-generation",
          stuck.map((assetId) => assetGenerateRequested.create({ assetId })),
        );
      }
      return { resent: stuck.length };
    },
  );
}

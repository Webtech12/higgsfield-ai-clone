import "server-only";

import { eventType, Inngest } from "inngest";
import { z } from "zod";

/**
 * The durable-workflow client (ADR-004) and every event in the system, typed with zod. The SDK reads
 * its own INNGEST_* variables (dev server locally, signing keys in production).
 */
export const inngest = new Inngest({ id: "director" });

export const projectCreated = eventType("project/created", {
  schema: z.object({ projectId: z.string() }),
});

export const projectPlanned = eventType("project/planned", {
  schema: z.object({ projectId: z.string() }),
});

export const assetGenerateRequested = eventType("asset/generate.requested", {
  schema: z.object({ assetId: z.string() }),
});

import type { ProduceResponse } from "@/contracts/project";
import { getModules } from "@/server/container";
import { accepted, handle } from "@/server/platform/http/handler";
import { assetGenerateRequested, inngest } from "@/server/platform/inngest";

import { requireViewer } from "../../../_lib/viewer";

export const runtime = "nodejs";

/**
 * Produce the chosen direction: 3 videos, 30 credits. 402 without enough credits, 429 at the cap,
 * 409 if it's already in production (which is also what makes a double click harmless).
 */
export const POST = handle(
  async (request: Request, context: RouteContext<"/api/v1/projects/[projectId]/productions">) => {
    const { projectId } = await context.params;
    const viewer = await requireViewer(request);
    const { onboarding, production } = getModules();

    await onboarding.ensureStarterCredits(viewer);
    const { assetIds } = await production.produceDirection({
      userId: viewer.id,
      isGuest: viewer.isGuest,
      projectId,
    });

    // After commit (ADR-018); the sweep re-sends if this is lost.
    await inngest.send(assetIds.map((assetId) => assetGenerateRequested.create({ assetId })));
    return accepted({ assetIds } satisfies ProduceResponse);
  },
);

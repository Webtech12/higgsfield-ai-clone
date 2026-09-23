import type { RetryResponse } from "@/contracts/project";
import { getModules } from "@/server/container";
import { accepted, handle } from "@/server/platform/http/handler";
import { assetGenerateRequested, inngest } from "@/server/platform/inngest";

import { requireViewer } from "../../../../../_lib/viewer";

export const runtime = "nodejs";

/** Retry a failed frame (free) or video (reserves its price again). */
export const POST = handle(
  async (
    request: Request,
    context: RouteContext<"/api/v1/projects/[projectId]/assets/[assetId]/retries">,
  ) => {
    const { projectId, assetId } = await context.params;
    const viewer = await requireViewer(request);
    const { onboarding, limits, production } = getModules();

    await limits.assertWithinRate(`retry:${viewer.id}`, 20, 3600);
    await onboarding.ensureStarterCredits(viewer);
    const result = await production.retryAsset({
      userId: viewer.id,
      isGuest: viewer.isGuest,
      projectId,
      assetId,
    });
    await inngest.send(assetGenerateRequested.create({ assetId: result.assetId }));
    return accepted(result satisfies RetryResponse);
  },
);

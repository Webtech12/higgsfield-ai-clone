import { getModules } from "@/server/container";
import { accepted, handle } from "@/server/platform/http/handler";
import { assetGenerateRequested, inngest } from "@/server/platform/inngest";

import { requireViewer } from "../../../../../_lib/viewer";

export const runtime = "nodejs";

/** Redraw one shot's storyboard frame after an edit (free; rate limits arrive with S3's limits). */
export const POST = handle(
  async (
    request: Request,
    context: RouteContext<"/api/v1/projects/[projectId]/shots/[shotId]/frame">,
  ) => {
    const { projectId, shotId } = await context.params;
    const viewer = await requireViewer(request);
    const { assetId } = await getModules().storyboard.redrawFrame({
      userId: viewer.id,
      projectId,
      shotId,
    });
    await inngest.send(assetGenerateRequested.create({ assetId }));
    return accepted({ assetId });
  },
);

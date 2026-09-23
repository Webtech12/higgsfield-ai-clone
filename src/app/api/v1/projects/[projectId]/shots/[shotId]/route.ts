import { UpdateShotInput } from "@/contracts/project";
import { getModules } from "@/server/container";
import { handle, readJson } from "@/server/platform/http/handler";

import { requireViewer } from "../../../../_lib/viewer";

export const runtime = "nodejs";

/** Edit a shot's recipe. Changing what the frame shows marks it stale; redrawing is a separate action. */
export const PATCH = handle(
  async (
    request: Request,
    context: RouteContext<"/api/v1/projects/[projectId]/shots/[shotId]">,
  ) => {
    const { projectId, shotId } = await context.params;
    const viewer = await requireViewer(request);
    const patch = await readJson(request, UpdateShotInput);
    const result = await getModules().projects.updateShot({
      userId: viewer.id,
      projectId,
      shotId,
      patch: Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)),
    });
    return Response.json(result);
  },
);

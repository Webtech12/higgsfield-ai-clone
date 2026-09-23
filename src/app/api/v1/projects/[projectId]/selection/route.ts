import { SelectDirectionInput } from "@/contracts/project";
import { getModules } from "@/server/container";
import { handle, readJson } from "@/server/platform/http/handler";

import { requireViewer } from "../../../_lib/viewer";

export const runtime = "nodejs";

export const POST = handle(
  async (request: Request, context: RouteContext<"/api/v1/projects/[projectId]/selection">) => {
    const { projectId } = await context.params;
    const viewer = await requireViewer(request);
    const { directionId } = await readJson(request, SelectDirectionInput);
    await getModules().projects.selectDirection({ userId: viewer.id, projectId, directionId });
    return Response.json({ ok: true });
  },
);

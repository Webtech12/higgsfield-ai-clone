import { getModules } from "@/server/container";
import { getCurrentUser } from "@/server/modules/identity";
import { getWorkspaceVersion, getWorkspaceView } from "@/server/queries";
import { readSnapshot } from "@/server/platform/db";
import { NotFoundError } from "@/server/platform/errors";
import { handle } from "@/server/platform/http/handler";

export const runtime = "nodejs";

/**
 * The workspace read model, polled every 2 s by useProject (ADR-013). A matching If-None-Match gets a
 * 304 from one cheap query, so polling costs almost nothing while nothing changes. Version and view
 * come from one snapshot, so a poll never sees half of a finishing asset's commit.
 */
export const GET = handle(
  async (request: Request, context: RouteContext<"/api/v1/projects/[projectId]">) => {
    const { projectId } = await context.params;
    const viewer = await getCurrentUser(request.headers);
    const viewerId = viewer?.id ?? null;
    const { db } = getModules();

    return readSnapshot(db, async (snapshot) => {
      const version = await getWorkspaceVersion(snapshot, projectId, viewerId);
      if (!version) throw new NotFoundError("Project not found");
      const etag = `W/"${version}"`;
      const headers = { ETag: etag, "Cache-Control": "private, no-cache" };
      if (request.headers.get("if-none-match") === etag)
        return new Response(null, { status: 304, headers });

      const view = await getWorkspaceView(snapshot, projectId, viewerId);
      if (!view) throw new NotFoundError("Project not found");
      return Response.json(view, { headers });
    });
  },
);

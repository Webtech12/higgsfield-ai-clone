import { getModules } from "@/server/container";
import { getCurrentUser } from "@/server/modules/identity";
import { getFinishedAssetUrl } from "@/server/queries";
import { NotFoundError } from "@/server/platform/errors";
import { handle } from "@/server/platform/http/handler";

export const runtime = "nodejs";

/**
 * A same-origin download link: browsers ignore the `download` attribute on cross-origin media, so
 * this redirects to the storage's forced-download URL (ADR-023). It is also the one place to gate
 * downloads later (sign-in, a talent's approval).
 */
export const GET = handle(
  async (
    request: Request,
    context: RouteContext<"/api/v1/projects/[projectId]/assets/[assetId]/download">,
  ) => {
    const { projectId, assetId } = await context.params;
    const viewer = await getCurrentUser(request.headers);
    const { db, media } = getModules();

    const url = await getFinishedAssetUrl(db, projectId, assetId, viewer?.id ?? null);
    if (!url) throw new NotFoundError("There's nothing to download here");
    return Response.redirect(new URL(media.downloadUrlFor(url), request.url), 302);
  },
);

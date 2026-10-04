import { shotFilename } from "@/contracts/project";
import { getModules } from "@/server/container";
import { getCurrentUser } from "@/server/modules/identity";
import { getDownloadableShot } from "@/server/queries";
import { NotFoundError } from "@/server/platform/errors";
import { handle } from "@/server/platform/http/handler";

export const runtime = "nodejs";

/**
 * Downloads a finished shot under a friendly name ("first-light-first-step-shot-1.mp4"). Browsers
 * ignore the `download` attribute on cross-origin media and the storage would name the file after
 * its key, so the file is streamed through here (ADR-023). This is also the one place to gate
 * downloads later (sign-in, a talent's approval).
 */
export const GET = handle(
  async (
    request: Request,
    context: RouteContext<"/api/v1/projects/[projectId]/assets/[assetId]/download">,
  ) => {
    const { projectId, assetId } = await context.params;
    const viewer = await getCurrentUser(request.headers);
    const shot = await getDownloadableShot(getModules().db, projectId, assetId, viewer?.id ?? null);
    if (!shot) throw new NotFoundError("There's nothing to download here");

    // Fake media is served by the app itself, so its URL is relative to this request.
    const upstream = await fetch(new URL(shot.url, request.url));
    if (!upstream.ok || !upstream.body) {
      throw new Error(`Couldn't fetch the shot (HTTP ${String(upstream.status)})`);
    }
    const length = upstream.headers.get("content-length");
    return new Response(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
        "Content-Disposition": `attachment; filename="${shotFilename(shot.filmTitle, shot.shotNumber, shot.url)}"`,
        ...(length ? { "Content-Length": length } : {}),
        "Cache-Control": "private, no-store",
      },
    });
  },
);

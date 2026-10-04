import { AdBriefInput } from "@/contracts/ad";
import type { CreateProjectResponse } from "@/contracts/project";
import { getModules } from "@/server/container";
import { accepted, handle, readJson } from "@/server/platform/http/handler";
import { inngest, projectCreated } from "@/server/platform/inngest";

import { networkOf } from "../_lib/network";

export const runtime = "nodejs";

/**
 * Ad brief → new ad → planning starts in the background (ADR-024). Creates a guest on first use.
 * Planning and the nine storyboard frames are free, so briefs have a daily allowance per network
 * (ADR-027) and an hourly limit per user, and stop at the kill-switch.
 */
export const POST = handle(async (request: Request) => {
  const brief = await readJson(request, AdBriefInput);
  const { limits, createAd, guestAccess } = getModules();
  const network = networkOf(request);

  await limits.assertDailyAllowance("brief", network);
  const viewer = await guestAccess.ensureViewer(request.headers, network);
  await limits.assertWithinRate(`brief:${viewer.id}`, 12, 3600);
  await limits.assertCanGenerate(viewer.id);

  const { projectId } = await createAd({ userId: viewer.id, brief });

  // After commit (ADR-018). If this send is lost, the project stays in `planning`.
  await inngest.send(projectCreated.create({ projectId }));
  return accepted({ projectId } satisfies CreateProjectResponse);
});

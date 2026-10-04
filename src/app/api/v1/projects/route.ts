import { AdBriefInput } from "@/contracts/ad";
import type { CreateProjectResponse } from "@/contracts/project";
import { getModules } from "@/server/container";
import { ensureViewer } from "@/server/modules/identity";
import { accepted, handle, readJson } from "@/server/platform/http/handler";
import { inngest, projectCreated } from "@/server/platform/inngest";

import { clientIp } from "../_lib/clientIp";

export const runtime = "nodejs";

/**
 * Ad brief → new ad → planning starts in the background (ADR-024). Creates a guest on first use.
 * Planning is free but rate-limited per IP (so bots can't mint guests) and per user, and stops at
 * the kill-switch.
 */
export const POST = handle(async (request: Request) => {
  const brief = await readJson(request, AdBriefInput);
  const { limits, createAd } = getModules();

  await limits.assertWithinRate(`brief-ip:${clientIp(request)}`, 30, 3600);
  const viewer = await ensureViewer(request.headers);
  await limits.assertWithinRate(`brief:${viewer.id}`, 12, 3600);
  await limits.assertCanGenerate(viewer.id);

  const { projectId } = await createAd({ userId: viewer.id, brief });

  // After commit (ADR-018). If this send is lost, the project stays in `planning`.
  await inngest.send(projectCreated.create({ projectId }));
  return accepted({ projectId } satisfies CreateProjectResponse);
});

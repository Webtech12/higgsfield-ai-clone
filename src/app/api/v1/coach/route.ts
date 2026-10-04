import { CoachDraft, type CoachResult } from "@/contracts/ad";
import { getModules } from "@/server/container";
import { ensureViewer } from "@/server/modules/identity";
import { handle, readJson } from "@/server/platform/http/handler";

import { clientIp } from "../_lib/clientIp";

export const runtime = "nodejs";

/**
 * Polish with AI: one LLM call that reviews a draft brief (ADR-024). Unlike generation, it answers
 * in the request: it's one structured call that the brand waits for, bounded by LLM_POLICY's
 * timeout, with no media and no money involved. Free, rate-limited per IP and per user.
 */
export const POST = handle(async (request: Request) => {
  const draft = await readJson(request, CoachDraft);
  const { limits, director } = getModules();

  await limits.assertWithinRate(`coach-ip:${clientIp(request)}`, 40, 3600);
  const viewer = await ensureViewer(request.headers);
  await limits.assertWithinRate(`coach:${viewer.id}`, 20, 3600);

  const result = await director.coachBrief(draft);
  return Response.json(result satisfies CoachResult);
});

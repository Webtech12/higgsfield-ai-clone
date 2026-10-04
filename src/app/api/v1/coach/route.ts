import { CoachDraft, type CoachResult } from "@/contracts/ad";
import { getModules } from "@/server/container";
import { handle, readJson } from "@/server/platform/http/handler";

import { networkOf } from "../_lib/network";

export const runtime = "nodejs";

/**
 * Polish with AI: one LLM call that reviews a draft brief (ADR-024). Unlike generation, it answers
 * in the request: it's one structured call that the brand waits for, bounded by LLM_POLICY's
 * timeout, with no media and no money involved. Free, with a daily allowance per network (ADR-027)
 * and an hourly limit per user.
 */
export const POST = handle(async (request: Request) => {
  const draft = await readJson(request, CoachDraft);
  const { limits, director, guestAccess } = getModules();
  const network = networkOf(request);

  await limits.assertDailyAllowance("coach", network);
  const viewer = await guestAccess.ensureViewer(request.headers, network);
  await limits.assertWithinRate(`coach:${viewer.id}`, 20, 3600);

  const result = await director.coachBrief(draft);
  return Response.json(result satisfies CoachResult);
});

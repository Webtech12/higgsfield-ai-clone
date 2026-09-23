import type { MeView } from "@/contracts/viewer";
import { getModules } from "@/server/container";
import { getCurrentUser } from "@/server/modules/identity";
import { handle } from "@/server/platform/http/handler";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "private, no-store" };

/**
 * Who is looking and what they can spend. Also the idempotent onboarding point: starter credits are
 * granted here (and before any spend), never on page load for anonymous visitors (AGENTS.md §5).
 */
export const GET = handle(async (request: Request) => {
  const viewer = await getCurrentUser(request.headers);
  const { onboarding, credits, limits, routing } = getModules();
  const prices = { video: routing.priceFor({ kind: "video" }) };

  if (!viewer) {
    const guestCap = (await limits.usageToday("anonymous", true)).cap;
    const body: MeView = { user: null, credits: 0, videosToday: 0, videoCap: guestCap, prices };
    return Response.json(body, { headers: NO_STORE });
  }

  await onboarding.ensureStarterCredits(viewer);
  const [balance, usage] = await Promise.all([
    credits.balanceOf(viewer.id),
    limits.usageToday(viewer.id, viewer.isGuest),
  ]);
  const body: MeView = {
    user: { id: viewer.id, isGuest: viewer.isGuest },
    credits: balance,
    videosToday: usage.videos,
    videoCap: usage.cap,
    prices,
  };
  return Response.json(body, { headers: NO_STORE });
});

import type { SessionResponse } from "@/contracts/viewer";
import { getModules } from "@/server/container";
import { handle } from "@/server/platform/http/handler";

import { networkOf } from "../_lib/network";

export const runtime = "nodejs";

/**
 * Starts the visitor's session before their first upload, Polish with AI or brief (AGENTS.md §5).
 * The browser asks once and shares the answer between concurrent actions, so picking three photos
 * makes one guest, not three. A new guest is a free trial: one per network a day (ADR-027).
 */
export const POST = handle(async (request: Request) => {
  const { limits, guestAccess } = getModules();
  const network = networkOf(request);

  await limits.assertWithinRate(`session-net:${network}`, 60, 3600);
  const viewer = await guestAccess.ensureViewer(request.headers, network);
  return Response.json({ isGuest: viewer.isGuest } satisfies SessionResponse);
});

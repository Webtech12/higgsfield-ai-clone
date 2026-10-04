import "server-only";

import type { Viewer } from "@/server/modules/identity";
import type { LimitsApi } from "@/server/modules/limits";

/**
 * Who is behind a request, making a guest on their first meaningful action (AGENTS.md §5). A new
 * guest is a free trial with starter credits, so one is made only while the visitor's network still
 * has today's trial (ADR-027). A process, not a module: it coordinates identity with limits.
 */
export function createGuestAccess(deps: {
  currentUser: (headers: Headers) => Promise<Viewer | null>;
  createGuest: (headers: Headers) => Promise<Viewer>;
  limits: Pick<LimitsApi, "assertTrialAvailable">;
}) {
  return {
    async ensureViewer(headers: Headers, network: string): Promise<Viewer> {
      const current = await deps.currentUser(headers);
      if (current) return current;
      await deps.limits.assertTrialAvailable(network);
      return deps.createGuest(headers);
    },
  };
}

export type GuestAccessProcess = ReturnType<typeof createGuestAccess>;

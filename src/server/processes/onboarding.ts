import "server-only";

import type { CreditsApi } from "@/server/modules/credits";

/**
 * Starter credits (AGENTS.md §5): 40 for a guest, 60 once per real account. A process, not a module:
 * it coordinates identity's notion of a viewer with credits. Grants are keyed, so calling this on
 * every /me and before every spend is safe and means a missed call can never lose a grant.
 */
export function createOnboarding(deps: { credits: CreditsApi }) {
  const { guest, signup } = deps.credits.starterGrants;
  return {
    async ensureStarterCredits(viewer: { id: string; isGuest: boolean }): Promise<void> {
      const grant = viewer.isGuest ? guest : signup;
      await deps.credits.grant({
        userId: viewer.id,
        amount: grant.amount,
        key: grant.key(viewer.id),
      });
    },
  };
}

export type OnboardingProcess = ReturnType<typeof createOnboarding>;

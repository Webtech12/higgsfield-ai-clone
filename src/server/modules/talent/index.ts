// talent: the roster of real people who signed a release (ADR-024). Public API only.
import type { Database } from "@/server/platform/db";

import { GetCasting } from "./application/GetCasting";
import { TalentRepository } from "./infrastructure/TalentRepository";

export { TalentUnavailableError, type Casting } from "./domain/casting";

export function createTalentModule(deps: { db: Database }) {
  const getCasting = new GetCasting({ talent: new TalentRepository(deps.db) });
  return {
    /** Photos and persona for generation; throws TalentUnavailableError for an inactive talent. */
    getCasting: getCasting.execute.bind(getCasting),
  };
}

export type TalentApi = ReturnType<typeof createTalentModule>;

// credits: the append-only ledger. Public API only (AGENTS.md §3).
import type { Database, Tx } from "@/server/platform/db";

import { ReserveCredits } from "./application/ReserveCredits";
import { SettleReservation } from "./application/SettleReservation";
import { CreditAccount, type ReservationItem } from "./domain/CreditAccount";
import { STARTER_GRANTS } from "./domain/policy";
import { CreditRepository } from "./infrastructure/CreditRepository";

export { InsufficientCreditsError, type ReservationItem } from "./domain/CreditAccount";
export { STARTER_GRANTS } from "./domain/policy";

export function createCreditsModule(deps: { db: Database }) {
  const repository = new CreditRepository(deps.db);
  const reserve = new ReserveCredits({ repository });
  const settle = new SettleReservation({ repository });

  return {
    /** Idempotent by key: granting twice with the same key adds credits once. */
    async grant(command: { userId: string; amount: number; key: string }, tx?: Tx): Promise<void> {
      await repository.append(
        [CreditAccount.grant(command.userId, command.amount, command.key)],
        tx,
      );
    },
    reserve: (tx: Tx, command: { userId: string; items: readonly ReservationItem[] }) =>
      reserve.execute(tx, command),
    capture: (command: { assetId: string; attempt: number }) =>
      settle.execute({ ...command, outcome: "capture" }),
    release: (command: { assetId: string; attempt: number }) =>
      settle.execute({ ...command, outcome: "release" }),
    balanceOf: (userId: string) => repository.balanceOf(userId),
    starterGrants: STARTER_GRANTS,
  };
}

export type CreditsApi = ReturnType<typeof createCreditsModule>;

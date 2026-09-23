import type { Tx } from "@/server/platform/db";

import type { ReservationItem } from "../domain/CreditAccount";
import type { CreditRepository } from "../infrastructure/CreditRepository";

/**
 * Money path, step 1 (ADR-007): lock the account row, check the balance covers everything, append the
 * reserve lines. Runs inside the caller's unit of work, so assets and caps commit with it or not at all.
 */
export class ReserveCredits {
  constructor(private readonly d: { repository: CreditRepository }) {}

  async execute(
    tx: Tx,
    command: { userId: string; items: readonly ReservationItem[] },
  ): Promise<void> {
    const account = await this.d.repository.lock(tx, command.userId);
    await this.d.repository.append(account.reserve(command.items), tx);
  }
}

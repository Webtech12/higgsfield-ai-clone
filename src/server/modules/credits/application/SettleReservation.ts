import { CreditAccount, reserveKey } from "../domain/CreditAccount";
import type { CreditRepository } from "../infrastructure/CreditRepository";

/**
 * Money path, step 2: capture on success, release on final failure. Idempotent, and a no-op for free
 * work (nothing was reserved), so production can call it for every asset without special cases.
 */
export class SettleReservation {
  constructor(private readonly d: { repository: CreditRepository }) {}

  async execute(command: {
    assetId: string;
    attempt: number;
    outcome: "capture" | "release";
  }): Promise<void> {
    const reservation = await this.d.repository.findByKey(
      reserveKey(command.assetId, command.attempt),
    );
    if (!reservation?.assetId) return;
    const entry = CreditAccount.settle(
      { userId: reservation.userId, amount: reservation.amount, assetId: reservation.assetId },
      command.attempt,
      command.outcome,
    );
    await this.d.repository.append([entry]);
  }
}

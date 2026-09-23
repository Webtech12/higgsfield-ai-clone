import { DomainError } from "@/server/platform/errors";

export type LedgerEntryType =
  "grant" | "reserve" | "capture" | "release" | "transfer_in" | "transfer_out";

/** One append-only ledger line. Balance = SUM(amount). The key makes every write idempotent. */
export interface LedgerEntry {
  userId: string;
  type: LedgerEntryType;
  amount: number;
  assetId: string | null;
  idempotencyKey: string;
}

export interface ReservationItem {
  assetId: string;
  /** Which attempt of the asset this pays for: a user retry reserves again (ADR-007). */
  attempt: number;
  cost: number;
}

export class InsufficientCreditsError extends DomainError {
  readonly code = "INSUFFICIENT_CREDITS";

  constructor(
    readonly needed: number,
    readonly available: number,
  ) {
    super(`This needs ${String(needed)} credits; ${String(available)} are available`);
  }
}

export const reserveKey = (assetId: string, attempt: number) =>
  `asset:${assetId}:${String(attempt)}:reserve`;

/**
 * A user's spendable balance at the moment its row was locked. It can only go down by reserving what
 * it covers, so concurrent spends can never overdraw (the row lock serialises them).
 */
export class CreditAccount {
  private constructor(
    readonly userId: string,
    private currentBalance: number,
  ) {}

  static open(userId: string, balance: number): CreditAccount {
    if (!Number.isInteger(balance))
      throw new Error(`Balance must be whole credits, got ${String(balance)}`);
    return new CreditAccount(userId, balance);
  }

  get balance(): number {
    return this.currentBalance;
  }

  reserve(items: readonly ReservationItem[]): LedgerEntry[] {
    const total = items.reduce((sum, item) => sum + item.cost, 0);
    if (total > this.currentBalance) throw new InsufficientCreditsError(total, this.currentBalance);
    this.currentBalance -= total;
    return items
      .filter((item) => item.cost > 0)
      .map((item) => ({
        userId: this.userId,
        type: "reserve" as const,
        amount: -item.cost,
        assetId: item.assetId,
        idempotencyKey: reserveKey(item.assetId, item.attempt),
      }));
  }

  static grant(userId: string, amount: number, idempotencyKey: string): LedgerEntry {
    if (!Number.isInteger(amount) || amount <= 0)
      throw new Error("A grant must be a positive whole number");
    return { userId, type: "grant", amount, assetId: null, idempotencyKey };
  }

  /**
   * Closes a reservation: capture keeps the spend (a zero-amount audit line), release refunds it.
   * Keyed per attempt, so settling twice is a no-op.
   */
  static settle(
    reservation: { userId: string; amount: number; assetId: string },
    attempt: number,
    outcome: "capture" | "release",
  ): LedgerEntry {
    return {
      userId: reservation.userId,
      type: outcome,
      amount: outcome === "capture" ? 0 : -reservation.amount,
      assetId: reservation.assetId,
      idempotencyKey: `asset:${reservation.assetId}:${String(attempt)}:settle`,
    };
  }
}

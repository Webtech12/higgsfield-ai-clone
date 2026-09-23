import "server-only";

import { eq, sql } from "drizzle-orm";

import { executor, type Database, type Tx } from "@/server/platform/db";

import { CreditAccount, type LedgerEntry } from "../domain/CreditAccount";
import { creditAccounts, creditLedger } from "./schema";

const balanceSql = sql<number>`coalesce(sum(${creditLedger.amount}), 0)`.mapWith(Number);

export class CreditRepository {
  constructor(private readonly db: Database) {}

  /** Locks the user's account row for the rest of the transaction and reads the balance under it. */
  async lock(tx: Tx, userId: string): Promise<CreditAccount> {
    const ex = executor(this.db, tx);
    await ex.insert(creditAccounts).values({ userId }).onConflictDoNothing();
    await ex.select().from(creditAccounts).where(eq(creditAccounts.userId, userId)).for("update");
    const [row] = await ex
      .select({ balance: balanceSql })
      .from(creditLedger)
      .where(eq(creditLedger.userId, userId));
    return CreditAccount.open(userId, row?.balance ?? 0);
  }

  /** Appends entries, skipping any whose idempotency key already exists. Returns how many were new. */
  async append(entries: readonly LedgerEntry[], tx?: Tx): Promise<number> {
    if (entries.length === 0) return 0;
    const ex = executor(this.db, tx);
    await ex
      .insert(creditAccounts)
      .values([...new Set(entries.map((e) => e.userId))].map((userId) => ({ userId })))
      .onConflictDoNothing();
    const inserted = await ex
      .insert(creditLedger)
      .values(entries.map((e) => ({ ...e, entryType: e.type })))
      .onConflictDoNothing({ target: creditLedger.idempotencyKey })
      .returning({ id: creditLedger.id });
    return inserted.length;
  }

  async findByKey(idempotencyKey: string, tx?: Tx): Promise<LedgerEntry | null> {
    const [row] = await executor(this.db, tx)
      .select()
      .from(creditLedger)
      .where(eq(creditLedger.idempotencyKey, idempotencyKey));
    if (!row) return null;
    return {
      userId: row.userId,
      type: row.entryType,
      amount: row.amount,
      assetId: row.assetId,
      idempotencyKey: row.idempotencyKey,
    };
  }

  async balanceOf(userId: string): Promise<number> {
    const [row] = await this.db
      .select({ balance: balanceSql })
      .from(creditLedger)
      .where(eq(creditLedger.userId, userId));
    return row?.balance ?? 0;
  }
}

import { sql } from "drizzle-orm";
import { bigserial, check, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import type { LedgerEntryType } from "../domain/CreditAccount";

/** One row per user: the row the money path locks (SELECT … FOR UPDATE) before spending (ADR-007). */
export const creditAccounts = pgTable("credit_accounts", {
  userId: text().primaryKey(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/** Append-only: rows are never updated or deleted. Balance = SUM(amount). */
export const creditLedger = pgTable(
  "credit_ledger",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    userId: text().notNull(),
    entryType: text().$type<LedgerEntryType>().notNull(),
    amount: integer().notNull(),
    assetId: text(),
    idempotencyKey: text().notNull().unique(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("credit_ledger_user_idx").on(t.userId),
    index("credit_ledger_asset_idx").on(t.assetId),
    check(
      "credit_ledger_type_check",
      sql`${t.entryType} in ('grant','reserve','capture','release','transfer_in','transfer_out')`,
    ),
  ],
);

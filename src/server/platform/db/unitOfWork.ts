import type { Database } from "./client";

type DrizzleTx = Parameters<Parameters<Database["transaction"]>[0]>[0];

declare const txBrand: unique symbol;

/**
 * An open transaction, passed across module APIs so one unit of work can span modules (AGENTS.md §3).
 * Opaque on purpose: application code can hand it on but never query with it, so Drizzle types
 * stay inside infrastructure.
 */
export interface Tx {
  readonly [txBrand]: true;
}

export interface UnitOfWork {
  run<T>(work: (tx: Tx) => Promise<T>): Promise<T>;
}

export function createUnitOfWork(db: Database): UnitOfWork {
  return {
    // The brand exists only at compile time; at runtime a Tx is the Drizzle transaction itself.
    run: (work) => db.transaction((drizzleTx) => work(drizzleTx as unknown as Tx)),
  };
}

/** What infrastructure and read queries run SQL with: the root database or an open transaction. */
export type Reader = Database | DrizzleTx;

/** Infrastructure only: the executor to query with (the open transaction, or the root database). */
export function executor(db: Database, tx?: Tx): Reader {
  return tx ? (tx as unknown as DrizzleTx) : db;
}

/**
 * Runs several reads against one consistent snapshot (REPEATABLE READ, read-only). A view assembled
 * from several SELECTs then never mixes rows from before and after a concurrent commit, e.g. a
 * finished asset whose shot doesn't point at it yet.
 */
export function readSnapshot<T>(db: Database, read: (snapshot: Reader) => Promise<T>): Promise<T> {
  return db.transaction((tx) => read(tx), {
    isolationLevel: "repeatable read",
    accessMode: "read only",
  });
}

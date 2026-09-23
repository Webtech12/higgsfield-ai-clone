import "server-only";

import { and, eq, inArray, lt, sql } from "drizzle-orm";

import type { AssetKind } from "@/contracts/project";
import { executor, type Database, type Tx } from "@/server/platform/db";

import { Asset } from "../domain/Asset";
import { assets } from "./schema";

export class AssetRepository {
  constructor(private readonly db: Database) {}

  async get(id: string, tx?: Tx): Promise<Asset | null> {
    const [row] = await executor(this.db, tx).select().from(assets).where(eq(assets.id, id));
    if (!row) return null;
    return Asset.rehydrate({
      id: row.id,
      projectId: row.projectId,
      shotId: row.shotId,
      kind: row.kind,
      version: row.version,
      parentAssetId: row.parentAssetId,
      status: row.status,
      model: row.model,
      prompt: row.prompt,
      sourceUrl: row.sourceUrl,
      providerRequestId: row.providerRequestId,
      url: row.url,
      error: row.error,
      costCredits: row.costCredits,
      attempt: row.attempt,
      meta: row.meta,
    });
  }

  /** Public URLs of finished assets, by id (e.g. the frames a production starts from). */
  async urlsOf(ids: readonly string[], tx?: Tx): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map();
    const rows = await executor(this.db, tx)
      .select({ id: assets.id, url: assets.url })
      .from(assets)
      .where(and(inArray(assets.id, [...ids]), eq(assets.status, "succeeded")));
    return new Map(rows.flatMap((r) => (r.url ? [[r.id, r.url] as const] : [])));
  }

  async nextVersion(shotId: string, kind: AssetKind, tx?: Tx): Promise<number> {
    const [row] = await executor(this.db, tx)
      // Postgres returns aggregates as strings; mapWith converts at the boundary.
      .select({ max: sql<number>`coalesce(max(${assets.version}), 0)`.mapWith(Number) })
      .from(assets)
      .where(and(eq(assets.shotId, shotId), eq(assets.kind, kind)));
    return (row?.max ?? 0) + 1;
  }

  async insert(asset: Asset, tx?: Tx): Promise<void> {
    await executor(this.db, tx).insert(assets).values(asset.toSnapshot());
  }

  /**
   * Guarded update: only applies if the row is still in the status we loaded it in. Returns false if
   * another step got there first, which callers treat as "already handled" (ADR-018).
   */
  async save(asset: Asset, tx?: Tx): Promise<boolean> {
    const { id, ...fields } = asset.toSnapshot();
    const expected = asset.persistedStatus;
    if (!expected) throw new Error("save() is for loaded assets; use insert() for new ones");
    const updated = await executor(this.db, tx)
      .update(assets)
      .set({ ...fields, updatedAt: new Date() })
      .where(and(eq(assets.id, id), eq(assets.status, expected)))
      .returning({ id: assets.id });
    return updated.length > 0;
  }

  /** Assets still queued after `before`: their generation event was probably lost (the sweep). */
  async queuedSince(before: Date, limit = 50): Promise<string[]> {
    const rows = await this.db
      .select({ id: assets.id })
      .from(assets)
      .where(and(eq(assets.status, "queued"), lt(assets.updatedAt, before)))
      .limit(limit);
    return rows.map((r) => r.id);
  }
}

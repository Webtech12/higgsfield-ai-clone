import "server-only";

import { and, eq, sql } from "drizzle-orm";

import type { AssetKind } from "@/contracts/project";
import type { Database } from "@/server/platform/db";

import { Asset } from "../domain/Asset";
import { assets } from "./schema";

export class AssetRepository {
  constructor(private readonly db: Database) {}

  async get(id: string): Promise<Asset | null> {
    const [row] = await this.db.select().from(assets).where(eq(assets.id, id));
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
      meta: row.meta,
    });
  }

  async nextVersion(shotId: string, kind: AssetKind): Promise<number> {
    const [row] = await this.db
      // Postgres returns aggregates as strings; mapWith converts at the boundary.
      .select({ max: sql<number>`coalesce(max(${assets.version}), 0)`.mapWith(Number) })
      .from(assets)
      .where(and(eq(assets.shotId, shotId), eq(assets.kind, kind)));
    return (row?.max ?? 0) + 1;
  }

  async insert(asset: Asset): Promise<void> {
    await this.db.insert(assets).values(asset.toSnapshot());
  }

  /**
   * Guarded update: only applies if the row is still in the status we loaded it in. Returns false if
   * another step got there first, which callers treat as "already handled" (ADR-018).
   */
  async save(asset: Asset): Promise<boolean> {
    const { id, ...fields } = asset.toSnapshot();
    const expected = asset.persistedStatus;
    if (!expected) throw new Error("save() is for loaded assets; use insert() for new ones");
    const updated = await this.db
      .update(assets)
      .set({ ...fields, updatedAt: new Date() })
      .where(and(eq(assets.id, id), eq(assets.status, expected)))
      .returning({ id: assets.id });
    return updated.length > 0;
  }
}

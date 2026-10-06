import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";

import type { AdSummary, BriefDraft } from "@/contracts/ads";
import { assets } from "@/server/modules/production/infrastructure/schema";
import { directions, projects, shots } from "@/server/modules/projects/infrastructure/schema";
import { talents } from "@/server/modules/talent/infrastructure/schema";
import type { Reader } from "@/server/platform/db";

/**
 * The viewer's library (My ads, ADR-028): read-only SQL across the projects, production and talent
 * tables, so it lives with the other read queries (ADR-019). Only the viewer's own ads, newest
 * first; the public example isn't theirs.
 */

const LIBRARY_LIMIT = 60;

type ShotRow = {
  projectId: string;
  directionId: string;
  directionOrdinal: number;
  ordinal: number;
  currentFrameAssetId: string | null;
  currentVideoAssetId: string | null;
};

type AssetRow = { id: string; url: string | null; status: string };

const isPresent = <T>(value: T | null): value is T => value !== null;

export async function listViewerAds(
  db: Reader,
  userId: string,
  options: { limit?: number } = {},
): Promise<AdSummary[]> {
  const rows = await db
    .select({
      id: projects.id,
      title: projects.title,
      status: projects.status,
      createdAt: projects.createdAt,
      aspectRatio: projects.aspectRatio,
      ad: projects.ad,
      talentId: projects.talentId,
      selectedDirectionId: projects.selectedDirectionId,
    })
    .from(projects)
    .where(and(eq(projects.userId, userId), eq(projects.isDemo, false)))
    .orderBy(desc(projects.createdAt))
    .limit(options.limit ?? LIBRARY_LIMIT);
  if (rows.length === 0) return [];

  // One query per table rather than in parallel: the reader may be a single snapshot client.
  const shotRows = await shotsOf(
    db,
    rows.map((r) => r.id),
  );
  const assetsById = await assetsOf(
    db,
    shotRows.flatMap((s) => [s.currentFrameAssetId, s.currentVideoAssetId]).filter(isPresent),
  );
  const castById = await castOf(db, [...new Set(rows.map((r) => r.talentId).filter(isPresent))]);

  return rows.map((row) => {
    const projectShots = shotRows.filter((s) => s.projectId === row.id);
    return {
      id: row.id,
      title: row.title,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      aspectRatio: row.aspectRatio,
      template: row.ad?.template ?? null,
      talent: row.talentId ? (castById.get(row.talentId) ?? null) : null,
      coverUrl: coverOf(projectShots, row.selectedDirectionId, assetsById),
      shots: videosOf(projectShots, row.selectedDirectionId, assetsById),
    };
  });
}

/** An earlier ad's brief, for its owner only: null for anyone else, or for films made before ads. */
export async function getBriefDraft(
  db: Reader,
  userId: string,
  projectId: string,
): Promise<BriefDraft | null> {
  const [row] = await db
    .select({
      ad: projects.ad,
      talentId: projects.talentId,
      aspectRatio: projects.aspectRatio,
      references: projects.references,
    })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
  if (!row?.ad) return null;
  return {
    fields: row.ad,
    talentId: row.talentId,
    aspectRatio: row.aspectRatio,
    photos: row.references.map(({ uploadId, role, url }) => ({ uploadId, role, url })),
  };
}

async function shotsOf(db: Reader, projectIds: string[]): Promise<ShotRow[]> {
  return db
    .select({
      projectId: shots.projectId,
      directionId: shots.directionId,
      directionOrdinal: directions.ordinal,
      ordinal: shots.ordinal,
      currentFrameAssetId: shots.currentFrameAssetId,
      currentVideoAssetId: shots.currentVideoAssetId,
    })
    .from(shots)
    .innerJoin(directions, eq(directions.id, shots.directionId))
    .where(inArray(shots.projectId, projectIds));
}

async function assetsOf(db: Reader, ids: string[]): Promise<Map<string, AssetRow>> {
  if (ids.length === 0) return new Map();
  const rows = await db
    .select({ id: assets.id, url: assets.url, status: assets.status })
    .from(assets)
    .where(inArray(assets.id, ids));
  return new Map(rows.map((row) => [row.id, row]));
}

async function castOf(
  db: Reader,
  talentIds: string[],
): Promise<Map<string, { name: string; photoUrl: string }>> {
  if (talentIds.length === 0) return new Map();
  const rows = await db
    .select({ id: talents.id, name: talents.name, photos: talents.photos })
    .from(talents)
    .where(inArray(talents.id, talentIds));
  return new Map(
    rows.flatMap((row) => {
      const photo = row.photos[0];
      return photo ? [[row.id, { name: row.name, photoUrl: photo.url }] as const] : [];
    }),
  );
}

/** The chosen concept's shots, else the first concept's, in order. */
function conceptShots(projectShots: ShotRow[], selectedDirectionId: string | null): ShotRow[] {
  const chosen = projectShots.filter((s) => s.directionId === selectedDirectionId);
  const pool = chosen.length > 0 ? chosen : projectShots.filter((s) => s.directionOrdinal === 0);
  return [...pool].sort((a, b) => a.ordinal - b.ordinal);
}

const readyUrl = (asset: AssetRow | undefined): string | null =>
  asset?.status === "succeeded" && asset.url ? asset.url : null;

function coverOf(
  projectShots: ShotRow[],
  selectedDirectionId: string | null,
  assetsById: Map<string, AssetRow>,
): string | null {
  for (const shot of conceptShots(projectShots, selectedDirectionId)) {
    const url = shot.currentFrameAssetId
      ? readyUrl(assetsById.get(shot.currentFrameAssetId))
      : null;
    if (url) return url;
  }
  return null;
}

function videosOf(
  projectShots: ShotRow[],
  selectedDirectionId: string | null,
  assetsById: Map<string, AssetRow>,
): { ready: number; total: number } {
  if (!selectedDirectionId) return { ready: 0, total: 0 };
  const chosen = projectShots.filter((s) => s.directionId === selectedDirectionId);
  const ready = chosen.filter(
    (s) => s.currentVideoAssetId && readyUrl(assetsById.get(s.currentVideoAssetId)),
  ).length;
  return { ready, total: chosen.length };
}

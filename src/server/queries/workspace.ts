import "server-only";

import { and, asc, desc, eq, max, or } from "drizzle-orm";

import type { AssetKind, AssetView, ShotView, WorkspaceView } from "@/contracts/project";
import type { CastView } from "@/contracts/talent";
import { assets } from "@/server/modules/production/infrastructure/schema";
import { directions, projects, shots } from "@/server/modules/projects/infrastructure/schema";
import { talents } from "@/server/modules/talent/infrastructure/schema";
import type { Reader } from "@/server/platform/db";

/**
 * The workspace read model (CQS, ADR-019): one flat view of a project for the Board and Studio.
 * The only code allowed to read across module tables; it never writes. Callers read the version and
 * the view inside one `readSnapshot`, so the ETag always describes the body it's sent with.
 */

const canView = (projectId: string, viewerId: string | null) =>
  and(
    eq(projects.id, projectId),
    viewerId
      ? or(eq(projects.userId, viewerId), eq(projects.isDemo, true))
      : eq(projects.isDemo, true),
  );

/** A cheap fingerprint for ETags: changes whenever the project or any of its assets change. */
export async function getWorkspaceVersion(
  db: Reader,
  projectId: string,
  viewerId: string | null,
): Promise<string | null> {
  const [row] = await db
    .select({ version: projects.version, assetsAt: max(assets.updatedAt) })
    .from(projects)
    .leftJoin(assets, eq(assets.projectId, projects.id))
    .where(canView(projectId, viewerId))
    .groupBy(projects.id);
  if (!row) return null;
  return `${String(row.version)}-${String(row.assetsAt?.getTime() ?? 0)}`;
}

/**
 * A finished shot the viewer may download (from their own project, or the public demo), with what
 * its friendly filename needs: the film's title and the shot's number in its direction.
 */
export async function getDownloadableShot(
  db: Reader,
  projectId: string,
  assetId: string,
  viewerId: string | null,
): Promise<{ url: string; filmTitle: string; shotNumber: number } | null> {
  const [row] = await db
    .select({
      url: assets.url,
      status: assets.status,
      filmTitle: projects.title,
      ordinal: shots.ordinal,
    })
    .from(assets)
    .innerJoin(projects, eq(projects.id, assets.projectId))
    .innerJoin(shots, eq(shots.id, assets.shotId))
    .where(and(eq(assets.id, assetId), canView(projectId, viewerId)));
  if (row?.status !== "succeeded" || !row.url) return null;
  return { url: row.url, filmTitle: row.filmTitle, shotNumber: row.ordinal + 1 };
}

/** The public demo film, if one is set: readable by anyone, writable by no one (AGENTS.md §5). */
export async function getDemoProjectId(db: Reader): Promise<string | null> {
  const [row] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.isDemo, true))
    .orderBy(desc(projects.updatedAt))
    .limit(1);
  return row?.id ?? null;
}

type AssetRow = typeof assets.$inferSelect;

const toAssetView = (row: AssetRow): AssetView => ({
  id: row.id,
  kind: row.kind,
  status: row.status,
  version: row.version,
  url: row.url,
  error: row.error,
});

/** The asset to display (current, else latest) and any newer attempt that hasn't succeeded. */
function pickAssets(rows: AssetRow[], currentId: string | null, kind: AssetKind) {
  const ofKind = rows.filter((r) => r.kind === kind); // already newest version first
  const latest = ofKind[0] ?? null;
  const current = ofKind.find((r) => r.id === currentId) ?? null;
  const shown = current ?? latest;
  const job = latest && latest.id !== shown?.id ? latest : null;
  return { shown: shown ? toAssetView(shown) : null, job: job ? toAssetView(job) : null };
}

function toShotView(s: typeof shots.$inferSelect, projectAssets: AssetRow[]): ShotView {
  const rows = projectAssets.filter((a) => a.shotId === s.id);
  const frame = pickAssets(rows, s.currentFrameAssetId, "frame");
  const video = pickAssets(rows, s.currentVideoAssetId, "video");
  return {
    id: s.id,
    ordinal: s.ordinal,
    title: s.title,
    description: s.description,
    motion: s.motion,
    cameraMove: s.cameraMove,
    durationS: s.durationS,
    lighting: s.lighting,
    mood: s.mood,
    frameStale: s.frameStale,
    frame: frame.shown,
    frameJob: frame.job,
    video: video.shown,
    videoJob: video.job,
  };
}

export async function getWorkspaceView(
  db: Reader,
  projectId: string,
  viewerId: string | null,
): Promise<WorkspaceView | null> {
  const [project] = await db.select().from(projects).where(canView(projectId, viewerId));
  if (!project) return null;

  const [directionRows, shotRows, assetRows, cast] = await Promise.all([
    db
      .select()
      .from(directions)
      .where(eq(directions.projectId, projectId))
      .orderBy(asc(directions.ordinal)),
    db.select().from(shots).where(eq(shots.projectId, projectId)).orderBy(asc(shots.ordinal)),
    db
      .select()
      .from(assets)
      .where(eq(assets.projectId, projectId))
      .orderBy(asc(assets.shotId), desc(assets.version)),
    project.talentId ? getCast(db, project.talentId) : Promise.resolve(null),
  ]);

  return {
    id: project.id,
    title: project.title,
    brief: project.brief,
    ad: project.ad,
    cast,
    // The photos' URLs and roles only: upload ids never leave the server.
    references: project.references.map(({ url, role }) => ({ url, role })),
    aspectRatio: project.aspectRatio,
    styles: project.styles,
    status: project.status,
    version: project.version,
    selectedDirectionId: project.selectedDirectionId,
    isDemo: project.isDemo,
    isOwner: viewerId !== null && project.userId === viewerId,
    directions: directionRows.map((d) => ({
      id: d.id,
      ordinal: d.ordinal,
      name: d.name,
      tagline: d.tagline,
      look: d.look,
      hook: d.hook,
      headline: d.headline,
      cta: d.cta,
      musicBrief: d.musicBrief,
      shots: shotRows.filter((s) => s.directionId === d.id).map((s) => toShotView(s, assetRows)),
    })),
  };
}

/**
 * The talent an ad was cast with, as its header shows them. Shown even if they've since been
 * deactivated: the ad already exists; deactivation only stops new generations (ADR-024).
 */
async function getCast(db: Reader, talentId: string): Promise<CastView | null> {
  const [row] = await db
    .select({
      id: talents.id,
      name: talents.name,
      tagline: talents.tagline,
      photos: talents.photos,
    })
    .from(talents)
    .where(eq(talents.id, talentId));
  const photo = row?.photos[0];
  if (!row || !photo) return null;
  return { id: row.id, name: row.name, tagline: row.tagline, photoUrl: photo.url };
}

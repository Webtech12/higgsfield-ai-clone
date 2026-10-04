import type { DirectionProps, ProjectProps, ShotProps } from "../domain/Project";
import type { directions, projects, shots } from "./schema";

type ProjectRow = typeof projects.$inferSelect;
type DirectionRow = typeof directions.$inferSelect;
type ShotRow = typeof shots.$inferSelect;

const toShotProps = (s: ShotRow): ShotProps => ({
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
  currentFrameAssetId: s.currentFrameAssetId,
  currentVideoAssetId: s.currentVideoAssetId,
});

const toDirectionProps = (d: DirectionRow, shotRows: ShotRow[]): DirectionProps => ({
  id: d.id,
  ordinal: d.ordinal,
  name: d.name,
  tagline: d.tagline,
  look: d.look,
  hook: d.hook,
  headline: d.headline,
  cta: d.cta,
  musicBrief: d.musicBrief,
  shots: shotRows.filter((s) => s.directionId === d.id).map(toShotProps),
});

/** Rows (ordered by ordinal) → the aggregate's state. */
export function toProjectProps(
  row: ProjectRow,
  directionRows: DirectionRow[],
  shotRows: ShotRow[],
): ProjectProps {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    brief: row.brief,
    ad: row.ad,
    talentId: row.talentId,
    references: row.references,
    aspectRatio: row.aspectRatio,
    styles: row.styles,
    status: row.status,
    selectedDirectionId: row.selectedDirectionId,
    isDemo: row.isDemo,
    elements: row.elements,
    directions: directionRows.map((d) => toDirectionProps(d, shotRows)),
  };
}

import type { AdBriefFields } from "@/contracts/ad";
import type { AspectRatio } from "@/contracts/brief";
import type { Elements } from "@/contracts/plan";
import type { CameraMove, ShotDuration } from "@/contracts/project";
import { NotFoundError } from "@/server/platform/errors";

import type { ProjectProps, ProjectReference } from "../domain/Project";
import type { ProjectRepository } from "../infrastructure/ProjectRepository";

import { assertCanEdit } from "./ownership";

/** Everything a prompt or a generation needs about one shot, shaped for director's PromptComposer. */
export interface ShotContext {
  projectId: string;
  aspectRatio: AspectRatio;
  elements: Elements;
  /** Who is cast (the talent module resolves their photos) and the brand's photos (ADR-024). */
  talentId: string | null;
  references: ProjectReference[];
  direction: { id: string; name: string; look: string };
  shot: {
    id: string;
    title: string;
    description: string;
    motion: string | null;
    cameraMove: CameraMove;
    lighting: string;
    mood: string;
    durationS: ShotDuration;
    currentFrameAssetId: string | null;
    currentVideoAssetId: string | null;
  };
}

/** The brief as the Director needs it, for planning. */
export interface PlanningInput {
  ad: AdBriefFields;
  aspectRatio: AspectRatio;
  talentId: string | null;
  photos: { product: number; scene: number };
}

/** Pure mapping from the aggregate's snapshot, optionally limited to some directions. */
export function toShotContexts(
  p: Readonly<ProjectProps>,
  directionFilter: (directionId: string) => boolean = () => true,
): ShotContext[] {
  const elements = p.elements;
  if (!elements) throw new NotFoundError(`Project ${p.id} has no plan yet`);
  return p.directions
    .filter((d) => directionFilter(d.id))
    .flatMap((d) =>
      d.shots.map((s): ShotContext => ({
        projectId: p.id,
        aspectRatio: p.aspectRatio,
        elements,
        talentId: p.talentId,
        references: p.references,
        direction: { id: d.id, name: d.name, look: d.look },
        shot: {
          id: s.id,
          title: s.title,
          description: s.description,
          motion: s.motion,
          cameraMove: s.cameraMove,
          lighting: s.lighting,
          mood: s.mood,
          durationS: s.durationS,
          currentFrameAssetId: s.currentFrameAssetId,
          currentVideoAssetId: s.currentVideoAssetId,
        },
      })),
    );
}

export class GetGenerationContext {
  constructor(private readonly d: { repository: ProjectRepository }) {}

  async planningInput(projectId: string): Promise<PlanningInput> {
    const project = await this.d.repository.load(projectId);
    if (!project) throw new NotFoundError(`Project ${projectId} not found`);
    const p = project.toSnapshot();
    if (!p.ad) throw new NotFoundError(`Project ${projectId} has no ad brief`);
    const count = (role: ProjectReference["role"]) =>
      p.references.filter((r) => r.role === role).length;
    return {
      ad: p.ad,
      aspectRatio: p.aspectRatio,
      talentId: p.talentId,
      photos: { product: count("product"), scene: count("scene") },
    };
  }

  /** Every shot in the project (for the first storyboard), or one shot the owner acts on. */
  async shots(
    projectId: string,
    only?: { shotId: string; userId: string },
  ): Promise<ShotContext[]> {
    const project = await this.d.repository.load(projectId);
    if (only) assertCanEdit(project, only.userId);
    if (!project) throw new NotFoundError(`Project ${projectId} not found`);
    const contexts = toShotContexts(project.toSnapshot());
    if (!only) return contexts;
    const match = contexts.filter((c) => c.shot.id === only.shotId);
    if (match.length === 0) throw new NotFoundError(`Shot ${only.shotId} not found`);
    return match;
  }

  /** Throws NotFound unless `userId` owns the project (and it isn't the read-only demo). */
  async assertOwner(userId: string, projectId: string): Promise<void> {
    assertCanEdit(await this.d.repository.load(projectId), userId);
  }
}

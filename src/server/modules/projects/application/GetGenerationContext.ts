import type { AspectRatio, BriefInput } from "@/contracts/brief";
import type { Elements } from "@/contracts/plan";
import type { CameraMove, ShotDuration } from "@/contracts/project";
import { NotFoundError } from "@/server/platform/errors";

import type { ProjectRepository } from "../infrastructure/ProjectRepository";

import { assertCanEdit } from "./ownership";

/** Everything a prompt needs about one shot, shaped for director's PromptComposer. */
export interface ShotContext {
  projectId: string;
  aspectRatio: AspectRatio;
  elements: Elements;
  direction: { id: string; name: string; look: string };
  shot: {
    id: string;
    title: string;
    description: string;
    cameraMove: CameraMove;
    lighting: string;
    mood: string;
    durationS: ShotDuration;
  };
}

export class GetGenerationContext {
  constructor(private readonly d: { repository: ProjectRepository }) {}

  /** The brief as the Director needs it, for planning. */
  async planningInput(projectId: string): Promise<BriefInput> {
    const project = await this.d.repository.load(projectId);
    if (!project) throw new NotFoundError(`Project ${projectId} not found`);
    const p = project.toSnapshot();
    return { idea: p.brief, aspectRatio: p.aspectRatio, styles: p.styles };
  }

  /** Every shot in the project (for the first storyboard), or one shot the owner asked to redraw. */
  async shots(
    projectId: string,
    only?: { shotId: string; userId: string },
  ): Promise<ShotContext[]> {
    const project = await this.d.repository.load(projectId);
    if (only) assertCanEdit(project, only.userId);
    if (!project) throw new NotFoundError(`Project ${projectId} not found`);
    const p = project.toSnapshot();
    const elements = p.elements;
    if (!elements) throw new NotFoundError(`Project ${projectId} has no plan yet`);

    const contexts = p.directions.flatMap((d) =>
      d.shots.map((s): ShotContext => ({
        projectId: p.id,
        aspectRatio: p.aspectRatio,
        elements,
        direction: { id: d.id, name: d.name, look: d.look },
        shot: {
          id: s.id,
          title: s.title,
          description: s.description,
          cameraMove: s.cameraMove,
          lighting: s.lighting,
          mood: s.mood,
          durationS: s.durationS,
        },
      })),
    );
    if (!only) return contexts;
    const match = contexts.filter((c) => c.shot.id === only.shotId);
    if (match.length === 0) throw new NotFoundError(`Shot ${only.shotId} not found`);
    return match;
  }
}

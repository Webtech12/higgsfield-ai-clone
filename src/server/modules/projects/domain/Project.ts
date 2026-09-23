import type { AspectRatio, StyleTag } from "@/contracts/brief";
import type { DirectorPlan, Elements } from "@/contracts/plan";
import type { CameraMove, ProjectStatus, ShotDuration } from "@/contracts/project";
import { DomainError, NotFoundError } from "@/server/platform/errors";

export class ProjectNotReadyError extends DomainError {
  readonly code = "PROJECT_NOT_READY";
}

export class DirectionAlreadySelectedError extends DomainError {
  readonly code = "DIRECTION_ALREADY_SELECTED";
}

export class ShotNotEditableError extends DomainError {
  readonly code = "SHOT_NOT_EDITABLE";
}

export interface ShotProps {
  id: string;
  ordinal: number;
  title: string;
  description: string;
  cameraMove: CameraMove;
  durationS: ShotDuration;
  lighting: string;
  mood: string;
  frameStale: boolean;
  currentFrameAssetId: string | null;
  currentVideoAssetId: string | null;
}

export interface DirectionProps {
  id: string;
  ordinal: number;
  name: string;
  tagline: string;
  look: string;
  shots: ShotProps[];
}

export interface ProjectProps {
  id: string;
  userId: string;
  title: string;
  brief: string;
  aspectRatio: AspectRatio;
  styles: StyleTag[];
  status: ProjectStatus;
  selectedDirectionId: string | null;
  isDemo: boolean;
  elements: Elements | null;
  directions: DirectionProps[];
}

export type ShotPatch = Partial<Pick<ShotProps, "description" | "cameraMove" | "durationS">>;

/**
 * The project aggregate: owns its directions and shots and guards their rules (one selected
 * direction; shots are editable only in the selected direction; an edit that changes what the frame
 * shows marks the frame stale).
 */
export class Project {
  private constructor(private props: ProjectProps) {}

  static create(input: {
    id: string;
    userId: string;
    brief: string;
    aspectRatio: AspectRatio;
    styles: StyleTag[];
  }): Project {
    return new Project({
      ...input,
      title: "Untitled film",
      status: "planning",
      selectedDirectionId: null,
      isDemo: false,
      elements: null,
      directions: [],
    });
  }

  static rehydrate(props: ProjectProps): Project {
    return new Project(structuredClone(props));
  }

  get id(): string {
    return this.props.id;
  }

  get status(): ProjectStatus {
    return this.props.status;
  }

  isOwnedBy(userId: string): boolean {
    return this.props.userId === userId;
  }

  applyPlan(plan: DirectorPlan, newId: (prefix: string) => string): void {
    if (this.props.status !== "planning") {
      throw new ProjectNotReadyError(`Project ${this.id} is not waiting for a plan`);
    }
    this.props.title = plan.title;
    this.props.elements = plan.elements;
    this.props.directions = plan.directions.map((direction, d) => ({
      id: newId("dir"),
      ordinal: d,
      name: direction.name,
      tagline: direction.tagline,
      look: direction.look,
      shots: direction.shots.map((shot, s) => ({
        id: newId("sht"),
        ordinal: s,
        ...shot,
        frameStale: false,
        currentFrameAssetId: null,
        currentVideoAssetId: null,
      })),
    }));
    this.props.status = "planned";
  }

  failPlanning(): void {
    if (this.props.status === "planning") this.props.status = "failed";
  }

  selectDirection(directionId: string): readonly ShotProps[] {
    if (this.props.selectedDirectionId) {
      throw new DirectionAlreadySelectedError(`Project ${this.id} already has a direction`);
    }
    if (this.props.status !== "planned") {
      throw new ProjectNotReadyError(`Project ${this.id} has no plan to choose from yet`);
    }
    const direction = this.findDirection(directionId);
    this.props.selectedDirectionId = direction.id;
    this.props.status = "selected";
    return direction.shots;
  }

  updateShot(shotId: string, patch: ShotPatch): ShotProps {
    const shot = this.findShotInSelectedDirection(shotId);
    const changesPicture =
      (patch.description !== undefined && patch.description !== shot.description) ||
      (patch.cameraMove !== undefined && patch.cameraMove !== shot.cameraMove);
    Object.assign(shot, patch);
    if (changesPicture) shot.frameStale = true;
    return { ...shot };
  }

  /** A new frame for the shot finished drawing: it becomes current and fresh. */
  setCurrentFrame(shotId: string, assetId: string): void {
    const shot = this.findShot(shotId);
    shot.currentFrameAssetId = assetId;
    shot.frameStale = false;
  }

  setCurrentVideo(shotId: string, assetId: string): void {
    this.findShot(shotId).currentVideoAssetId = assetId;
  }

  reassignOwner(fromUserId: string, toUserId: string): void {
    if (this.props.userId === fromUserId) this.props.userId = toUserId;
  }

  toSnapshot(): Readonly<ProjectProps> {
    return structuredClone(this.props);
  }

  private findDirection(directionId: string): DirectionProps {
    const direction = this.props.directions.find((d) => d.id === directionId);
    if (!direction)
      throw new NotFoundError(`Direction ${directionId} is not in project ${this.id}`);
    return direction;
  }

  private findShot(shotId: string): ShotProps {
    for (const direction of this.props.directions) {
      const shot = direction.shots.find((s) => s.id === shotId);
      if (shot) return shot;
    }
    throw new NotFoundError(`Shot ${shotId} is not in project ${this.id}`);
  }

  private findShotInSelectedDirection(shotId: string): ShotProps {
    const selected = this.props.directions.find((d) => d.id === this.props.selectedDirectionId);
    const shot = selected?.shots.find((s) => s.id === shotId);
    if (!shot) {
      throw new ShotNotEditableError("Only shots in the selected direction can be edited");
    }
    return shot;
  }
}

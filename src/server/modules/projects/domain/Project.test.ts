import { describe, expect, it } from "vitest";

import type { DirectorPlan } from "@/contracts/plan";
import { NotFoundError } from "@/server/platform/errors";

import {
  DirectionAlreadySelectedError,
  Project,
  ProjectNotReadyError,
  ShotNotEditableError,
} from "./Project";

const shot = (title: string) => ({
  title,
  description: `${title} description`,
  cameraMove: "dolly-in" as const,
  durationS: 5 as const,
  lighting: "tungsten",
  mood: "hushed",
});

const direction = (name: string) => ({
  name,
  tagline: `${name} tagline`,
  look: `${name} look`,
  shots: [shot(`${name} 1`), shot(`${name} 2`), shot(`${name} 3`)],
});

const plan: DirectorPlan = {
  title: "The Keeper",
  elements: { character: "a keeper", location: "a lighthouse", style: "grainy 16mm" },
  directions: [direction("Quiet"), direction("Bold"), direction("Dream")],
};

let counter = 0;
const newId = (prefix: string) => `${prefix}_${String(++counter)}`;

const plannedProject = () => {
  const project = Project.create({
    id: "prj_1",
    userId: "usr_1",
    brief: "A lighthouse keeper finds a message from her future self",
    aspectRatio: "16:9",
    styles: [],
  });
  project.applyPlan(plan, newId);
  return project;
};

const directionId = (project: Project, index: number) => {
  const found = project.toSnapshot().directions[index];
  if (!found) throw new Error("fixture has 3 directions");
  return found;
};

describe("Project", () => {
  it("applies a plan: 3 directions of 3 shots, status planned", () => {
    const project = plannedProject();
    const snapshot = project.toSnapshot();

    expect(project.status).toBe("planned");
    expect(snapshot.title).toBe("The Keeper");
    expect(snapshot.directions).toHaveLength(3);
    expect(snapshot.directions.every((d) => d.shots.length === 3)).toBe(true);
  });

  it("refuses a second plan", () => {
    const project = plannedProject();

    expect(() => {
      project.applyPlan(plan, newId);
    }).toThrow(ProjectNotReadyError);
  });

  it("selects exactly one direction and moves to selected", () => {
    const project = plannedProject();
    const chosen = directionId(project, 1);

    const shots = project.selectDirection(chosen.id);

    expect(shots).toHaveLength(3);
    expect(project.status).toBe("selected");
    expect(project.toSnapshot().selectedDirectionId).toBe(chosen.id);
    expect(() => project.selectDirection(directionId(project, 0).id)).toThrow(
      DirectionAlreadySelectedError,
    );
  });

  it("cannot select before planning is done", () => {
    const project = Project.create({
      id: "prj_2",
      userId: "usr_1",
      brief: "brief",
      aspectRatio: "1:1",
      styles: [],
    });

    expect(() => project.selectDirection("dir_x")).toThrow(ProjectNotReadyError);
  });

  it("rejects a direction from another project", () => {
    expect(() => plannedProject().selectDirection("dir_elsewhere")).toThrow(NotFoundError);
  });

  it("marks the frame stale when an edit changes the picture, not the duration", () => {
    const project = plannedProject();
    const chosen = directionId(project, 0);
    project.selectDirection(chosen.id);
    const [first, second] = chosen.shots;
    if (!first || !second) throw new Error("fixture has 3 shots");

    expect(project.updateShot(first.id, { durationS: 8 }).frameStale).toBe(false);
    expect(project.updateShot(second.id, { cameraMove: "orbit" }).frameStale).toBe(true);
  });

  it("only edits shots in the selected direction", () => {
    const project = plannedProject();
    project.selectDirection(directionId(project, 0).id);
    const other = directionId(project, 2).shots[0];
    if (!other) throw new Error("fixture has 3 shots");

    expect(() => project.updateShot(other.id, { durationS: 4 })).toThrow(ShotNotEditableError);
  });

  it("clears the stale flag when a new frame becomes current", () => {
    const project = plannedProject();
    const chosen = directionId(project, 0);
    project.selectDirection(chosen.id);
    const target = chosen.shots[0];
    if (!target) throw new Error("fixture has 3 shots");
    project.updateShot(target.id, { description: "Rain on the lamp glass" });

    project.setCurrentFrame(target.id, "ast_9");

    const after = directionId(project, 0).shots[0];
    expect(after?.frameStale).toBe(false);
    expect(after?.currentFrameAssetId).toBe("ast_9");
  });
});

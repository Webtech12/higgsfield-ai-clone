import { describe, expect, it } from "vitest";

import type { AdBriefFields } from "@/contracts/ad";
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
  motion: `${title} motion`,
  cameraMove: "dolly-in" as const,
  durationS: 5 as const,
  lighting: "tungsten",
  mood: "hushed",
});

const direction = (name: string) => ({
  name,
  tagline: `${name} tagline`,
  look: `${name} look`,
  hook: `${name} hook`,
  headline: `${name} headline`,
  cta: "Shop now",
  musicBrief: "Warm indie pop, 104 BPM",
  shots: [shot(`${name} 1`), shot(`${name} 2`), shot(`${name} 3`)],
});

const plan: DirectorPlan = {
  title: "LUMA · UGC testimonial",
  elements: { character: "the talent", location: "a bright bathroom", style: "clean" },
  directions: [direction("Real Talk"), direction("Studio Gloss"), direction("Golden Hour")],
};

const ad: AdBriefFields = {
  template: "ugc-testimonial",
  productName: "LUMA Vitamin C Serum",
  benefit: "Brighter, more even skin in two weeks",
  audience: "",
  message: "",
  cta: "",
  moods: [],
  sceneDirection: "",
};

let counter = 0;
const newId = (prefix: string) => `${prefix}_${String(++counter)}`;

const newProject = (id = "prj_1") =>
  Project.create({
    id,
    userId: "usr_1",
    ad,
    talentId: "tal_1",
    references: [{ uploadId: "upl_1", url: "https://cdn/luma.jpg", role: "product" }],
    aspectRatio: "9:16",
  });

const plannedProject = () => {
  const project = newProject();
  project.applyPlan(plan, newId);
  return project;
};

const directionId = (project: Project, index: number) => {
  const found = project.toSnapshot().directions[index];
  if (!found) throw new Error("fixture has 3 directions");
  return found;
};

describe("Project", () => {
  it("starts from the ad brief, with a one-line summary for headers", () => {
    const snapshot = newProject().toSnapshot();

    expect(snapshot.status).toBe("planning");
    expect(snapshot.brief).toBe(
      "UGC testimonial for LUMA Vitamin C Serum. Brighter, more even skin in two weeks",
    );
    expect(snapshot.talentId).toBe("tal_1");
    expect(snapshot.references).toHaveLength(1);
  });

  it("applies a plan: 3 concepts of 3 shots with their ad fields, status planned", () => {
    const project = plannedProject();
    const snapshot = project.toSnapshot();

    expect(project.status).toBe("planned");
    expect(snapshot.title).toBe("LUMA · UGC testimonial");
    expect(snapshot.directions).toHaveLength(3);
    expect(snapshot.directions.every((d) => d.shots.length === 3)).toBe(true);
    expect(snapshot.directions[0]).toMatchObject({
      hook: "Real Talk hook",
      headline: "Real Talk headline",
      cta: "Shop now",
    });
    expect(snapshot.directions[0]?.shots[0]?.motion).toBe("Real Talk 1 motion");
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
    expect(() => newProject("prj_2").selectDirection("dir_x")).toThrow(ProjectNotReadyError);
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

  it("produces the chosen direction once, then locks shot edits", () => {
    const project = plannedProject();
    const chosen = directionId(project, 2);
    project.selectDirection(chosen.id);

    const shots = project.startProduction();

    expect(project.status).toBe("producing");
    expect(shots.map((s) => s.id)).toEqual(chosen.shots.map((s) => s.id));
    expect(() => project.startProduction()).toThrow(ProjectNotReadyError);
    const first = chosen.shots[0];
    if (!first) throw new Error("fixture has 3 shots");
    expect(() => project.updateShot(first.id, { durationS: 8 })).toThrow(ShotNotEditableError);
  });

  it("cannot produce before a direction is chosen", () => {
    expect(() => plannedProject().startProduction()).toThrow(ProjectNotReadyError);
  });

  it("becomes ready when every shot in the chosen direction has a video", () => {
    const project = plannedProject();
    const chosen = directionId(project, 0);
    project.selectDirection(chosen.id);
    project.startProduction();

    chosen.shots.forEach((shot, index) => {
      expect(project.status).toBe("producing");
      project.setCurrentVideo(shot.id, `ast_v${String(index)}`);
    });

    expect(project.status).toBe("ready");
  });
});

import { describe, expect, it, vi } from "vitest";

import type { DirectorPlan, PlannedDirection } from "@/contracts/plan";
import type { ProjectsApi } from "@/server/modules/projects";
import type { TalentApi } from "@/server/modules/talent";

import { PlanningRequest } from "../domain/requests";
import type { LLMProvider, StructuredRequest } from "../ports/LLMProvider";
import { PlanProject } from "./PlanProject";

const concept = (name: string): PlannedDirection => ({
  name,
  tagline: `${name} tagline`,
  look: "warm daylight",
  hook: "A bite at the summit",
  headline: "Fuel for the long way up",
  cta: "Shop Trailmix",
  musicBrief: "Indie folk, 100 BPM, guitar and claps",
  shots: [1, 2, 3].map((n) => ({
    title: `Beat ${String(n)}`,
    description: "The talent holds the product on the trail",
    motion: "She unwraps the bar and takes a bite",
    cameraMove: "dolly-in" as const,
    durationS: 5 as const,
    lighting: "golden hour",
    mood: "free",
  })),
});

const validPlan = (): DirectorPlan => ({
  title: "Trailmix Bar · Lifestyle",
  elements: { character: "the talent in hiking gear", location: "a ridge trail", style: "warm" },
  directions: [concept("Summit"), concept("Basecamp"), concept("Sunrise")],
});

const planningInput = {
  ad: {
    template: "lifestyle" as const,
    productName: "Trailmix Bar",
    benefit: "Real fruit and oats that keep you going on long hikes",
    audience: "Weekend hikers",
    message: "",
    cta: "",
    moods: [],
    sceneDirection: "",
  },
  aspectRatio: "9:16" as const,
  talentId: "tal_1",
  photos: { product: 1, scene: 0 },
};

function setup(answers: (() => unknown)[]) {
  const requests: StructuredRequest<unknown>[] = [];
  const llm: LLMProvider = {
    structured: <T>(request: StructuredRequest<T>) => {
      requests.push(request);
      const answer = answers[requests.length - 1];
      if (!answer) return Promise.reject(new Error("no more answers"));
      try {
        return Promise.resolve(request.schema.parse(answer()));
      } catch (error) {
        return Promise.reject(error instanceof Error ? error : new Error(String(error)));
      }
    },
  };
  const applyPlan = vi.fn<ProjectsApi["applyPlan"]>(() => Promise.resolve());
  const projects = {
    getPlanningInput: () => Promise.resolve(planningInput),
    applyPlan,
  } as unknown as ProjectsApi;
  const talent: TalentApi = {
    getCasting: () =>
      Promise.resolve({
        talentId: "tal_1",
        name: "Kai Okafor",
        persona: "Running coach. Early trail runs.",
        photoUrls: ["https://cdn/kai.jpg"],
      }),
  };
  return { useCase: new PlanProject({ llm, projects, talent }), requests, applyPlan };
}

describe("PlanProject", () => {
  it("sends the template's beats and the talent's persona, never their name", async () => {
    const { useCase, requests, applyPlan } = setup([validPlan]);

    await useCase.execute({ projectId: "prj_1" });

    const sent = PlanningRequest.parse(JSON.parse(requests[0]?.input ?? "{}"));
    expect(sent.template.beats).toHaveLength(3);
    expect(sent.talent).toEqual({ persona: "Running coach. Early trail runs." });
    expect(requests[0]?.input).not.toContain("Kai");
    expect(applyPlan).toHaveBeenCalledOnce();
  });

  it("retries once with a repair hint when the first answer doesn't fit the schema", async () => {
    const { useCase, requests, applyPlan } = setup([() => ({ directions: [] }), validPlan]);

    await useCase.execute({ projectId: "prj_1" });

    expect(requests).toHaveLength(2);
    expect(requests[1]?.system).toContain("did not match the required structure");
    expect(applyPlan).toHaveBeenCalledOnce();
  });
});

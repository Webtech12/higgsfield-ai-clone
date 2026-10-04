import { describe, expect, it } from "vitest";

import { CoachResult } from "@/contracts/ad";
import { DirectorPlan } from "@/contracts/plan";
import type { CoachRequest, LLMProvider, PlanningRequest } from "@/server/modules/director";

const template = {
  id: "ugc-testimonial",
  label: "UGC testimonial",
  beats: [
    "Hook: the talent looks into the lens with the product in hand, mid-reaction",
    "Proof: the product in use, close and honest",
    "Payoff: the talent's verdict, product to camera",
  ],
  needsTalent: true,
} satisfies PlanningRequest["template"];

const planning: PlanningRequest = {
  template,
  brief: {
    template: "ugc-testimonial",
    productName: "LUMA Vitamin C Serum",
    benefit: "Brighter, more even-looking skin with a two-minute morning routine",
    audience: "Women 25 to 40 with busy mornings",
    message: "Glow without the fuss",
    cta: "Shop LUMA",
    moods: ["fresh", "warm"],
    sceneDirection: "A bright bathroom in the morning, natural window light",
  },
  aspectRatio: "9:16",
  talent: { persona: "Skincare creator. Calm, honest reviews of her morning routine." },
  photos: { product: 1, scene: 0 },
};

const coaching: CoachRequest = {
  template,
  draft: {
    productName: "LUMA serum",
    benefit: "It makes your skin look good",
    audience: "",
    message: "",
    cta: "",
    moods: [],
    sceneDirection: "",
  },
  talent: null,
  photos: { product: 0 },
};

/**
 * The behaviour every LLMProvider must share: a structured call returns a value that passed the
 * request's schema. It uses the real plan and coach schemas, so a provider whose structured-output
 * mode can't express them fails here rather than in production.
 */
export function describeLLMProviderContract(
  name: string,
  makeProvider: () => LLMProvider,
  timeoutMs: number,
) {
  describe(`LLMProvider contract: ${name}`, () => {
    const provider = makeProvider();

    it(
      "returns an ad plan that passes the DirectorPlan schema",
      async () => {
        const plan = await provider.structured({
          purpose: "plan",
          system:
            "You are an ad creative director. Propose exactly three different concepts for the brand's brief, each told in exactly three shots that follow the template's beats.",
          input: JSON.stringify(planning),
          schema: DirectorPlan,
        });

        expect(() => DirectorPlan.parse(plan)).not.toThrow();
        expect(plan.directions).toHaveLength(3);
        expect(plan.directions.every((direction) => direction.shots.length === 3)).toBe(true);
      },
      timeoutMs,
    );

    it(
      "returns coaching that passes the CoachResult schema",
      async () => {
        const result = await provider.structured({
          purpose: "coach",
          system:
            "You coach brands on ad briefs. Suggest sharper fields, list what's missing and give up to three tips.",
          input: JSON.stringify(coaching),
          schema: CoachResult,
        });

        expect(() => CoachResult.parse(result)).not.toThrow();
      },
      timeoutMs,
    );
  });
}

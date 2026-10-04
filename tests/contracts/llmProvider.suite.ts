import { describe, expect, it } from "vitest";

import { DirectorPlan } from "@/contracts/plan";
import type { LLMProvider } from "@/server/modules/director";

/**
 * The behaviour every LLMProvider must share: a structured call returns a value that passed the
 * request's schema. It uses the real plan schema, so a provider whose structured-output mode can't
 * express it fails here rather than in production.
 */
export function describeLLMProviderContract(
  name: string,
  makeProvider: () => LLMProvider,
  timeoutMs: number,
) {
  describe(`LLMProvider contract: ${name}`, () => {
    const provider = makeProvider();

    it(
      "returns a plan that passes the DirectorPlan schema",
      async () => {
        const plan = await provider.structured({
          purpose: "plan",
          system:
            "You are a film director. Propose exactly three different creative directions for the creator's idea, each told in exactly three shots.",
          input: JSON.stringify({
            idea: "A lighthouse keeper finds a message in a bottle from her future self",
            aspectRatio: "16:9",
            styles: [],
          }),
          schema: DirectorPlan,
        });

        expect(() => DirectorPlan.parse(plan)).not.toThrow();
        expect(plan.directions).toHaveLength(3);
        expect(plan.directions.every((direction) => direction.shots.length === 3)).toBe(true);
      },
      timeoutMs,
    );
  });
}

import { describe, expect, it } from "vitest";

import type { CoachDraft, CoachResult } from "@/contracts/ad";
import type { TalentApi } from "@/server/modules/talent";

import type { LLMProvider, StructuredRequest } from "../ports/LLMProvider";
import { CoachBrief } from "./CoachBrief";

const draft: CoachDraft = {
  template: "product-hero",
  productName: "Aero Bottle",
  benefit: "Keeps water cold for 24 hours",
  audience: "",
  message: "",
  cta: "",
  moods: [],
  sceneDirection: "",
  talentId: null,
  productPhotoCount: 0,
};

const talent: TalentApi = { getCasting: () => Promise.reject(new Error("no talent expected")) };

function coachReturning(result: CoachResult) {
  let sent: StructuredRequest<unknown> | undefined;
  const llm: LLMProvider = {
    structured: <T>(request: StructuredRequest<T>) => {
      sent = request;
      return Promise.resolve(request.schema.parse(result));
    },
  };
  return { coach: new CoachBrief({ llm, talent }), sent: () => sent };
}

describe("CoachBrief", () => {
  it("drops suggestions that wouldn't fit their field, and keeps the rest", async () => {
    const { coach } = coachReturning({
      suggestions: [
        { field: "cta", value: "Grab your Aero today", why: "Short and active" },
        { field: "cta", value: "x".repeat(41), why: "Too long for the button" },
      ],
      missing: [{ field: "productPhoto", why: "Keeps the bottle exact" }],
      tips: ["Open on the condensation"],
    });

    const result = await coach.execute(draft);

    expect(result.suggestions.map((s) => s.value)).toEqual(["Grab your Aero today"]);
    expect(result.missing).toHaveLength(1);
  });

  it("tells the coach how many product photos there are, without the client's ids", async () => {
    const { coach, sent } = coachReturning({ suggestions: [], missing: [], tips: [] });

    await coach.execute({ ...draft, productPhotoCount: 2 });

    const input = JSON.parse(sent()?.input ?? "{}") as Record<string, unknown>;
    expect(input.photos).toEqual({ product: 2 });
    expect(input).not.toHaveProperty("talentId");
  });
});

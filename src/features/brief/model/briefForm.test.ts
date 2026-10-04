import { describe, expect, it } from "vitest";

import { AD_TEMPLATES, CoachDraft } from "@/contracts/ad";

import { beatDetail, beatName, BRIEF_DEFAULTS, canCoach, toCoachDraft } from "./briefForm";

describe("toCoachDraft", () => {
  it("trims the text, counts product photos and passes a draft the API accepts", () => {
    const draft = toCoachDraft({
      ...BRIEF_DEFAULTS,
      productName: "  LUMA  ",
      references: [
        { uploadId: "upl_1", role: "product" },
        { uploadId: "upl_2", role: "scene" },
      ],
    });

    expect(draft.productName).toBe("LUMA");
    expect(draft.productPhotoCount).toBe(1);
    expect(CoachDraft.safeParse(draft).success).toBe(true);
  });
});

describe("canCoach", () => {
  it("waits until something is written", () => {
    expect(canCoach(BRIEF_DEFAULTS)).toBe(false);
    expect(canCoach({ ...BRIEF_DEFAULTS, sceneDirection: "A rooftop at dusk" })).toBe(true);
  });
});

describe("beats", () => {
  it("splits a template beat into its name and what it asks for", () => {
    const [hook] = AD_TEMPLATES["ugc-testimonial"].beats;
    expect(beatName(hook)).toBe("Hook");
    expect(beatDetail(hook)).toBe(
      "the talent looks into the lens with the product in hand, mid-reaction",
    );
  });
});

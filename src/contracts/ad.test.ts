import { describe, expect, it } from "vitest";

import { AdBriefInput, CoachDraft, fitsField, type AdBriefInput as Brief } from "./ad";

const brief = (overrides: Partial<Brief> = {}): Brief => ({
  template: "ugc-testimonial",
  productName: "LUMA Vitamin C Serum",
  benefit: "Brighter, more even skin in two weeks",
  audience: "",
  message: "",
  cta: "",
  moods: [],
  sceneDirection: "",
  talentId: "tal_1",
  references: [],
  aspectRatio: "9:16",
  ...overrides,
});

const issuesOf = (input: unknown) => {
  const result = AdBriefInput.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));
};

describe("AdBriefInput", () => {
  it("accepts a brief with only the required fields", () => {
    expect(issuesOf(brief())).toEqual([]);
  });

  it("needs a talent for formats with a person on screen", () => {
    expect(issuesOf(brief({ talentId: null }))).toEqual(["talentId"]);
  });

  it("lets a product hero go without a talent", () => {
    expect(issuesOf(brief({ template: "product-hero", talentId: null }))).toEqual([]);
  });

  it("caps product photos at three and scene photos at two", () => {
    const product = (n: number) => ({ uploadId: `upl_${String(n)}`, role: "product" as const });
    const scene = (n: number) => ({ uploadId: `upl_s${String(n)}`, role: "scene" as const });
    expect(issuesOf(brief({ references: [1, 2, 3].map(product) }))).toEqual([]);
    expect(issuesOf(brief({ references: [1, 2, 3, 4].map(product) }))).toEqual(["references"]);
    expect(issuesOf(brief({ references: [1, 2, 3].map(scene) }))).toEqual(["references"]);
  });

  it("trims text and still enforces the minimum length", () => {
    const parsed = AdBriefInput.parse(brief({ productName: "  LUMA  " }));
    expect(parsed.productName).toBe("LUMA");
    expect(issuesOf(brief({ benefit: "   short   " }))).toEqual(["benefit"]);
  });
});

describe("CoachDraft", () => {
  const draft = {
    template: "lifestyle" as const,
    productName: "",
    benefit: "",
    audience: "",
    message: "",
    cta: "",
    moods: [],
    sceneDirection: "",
    talentId: null,
    productPhotoCount: 0,
  };

  it("needs something written about the product", () => {
    expect(CoachDraft.safeParse(draft).success).toBe(false);
    expect(CoachDraft.safeParse({ ...draft, productName: "LUMA" }).success).toBe(true);
  });
});

describe("fitsField", () => {
  it("rejects suggestions that would break the field's limits", () => {
    expect(fitsField({ field: "cta", value: "Shop LUMA today", why: "w" })).toBe(true);
    expect(fitsField({ field: "cta", value: "x".repeat(41), why: "w" })).toBe(false);
    expect(fitsField({ field: "benefit", value: "Too short", why: "w" })).toBe(false);
    expect(fitsField({ field: "audience", value: "   ", why: "w" })).toBe(false);
  });
});

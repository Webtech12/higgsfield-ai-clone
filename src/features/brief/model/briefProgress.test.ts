import { describe, expect, it } from "vitest";

import { briefProgress, submitStatus } from "./briefProgress";

const empty = {
  template: "ugc-testimonial" as const,
  productName: "",
  benefit: "",
  talentId: null,
  productPhotos: 0,
};

describe("briefProgress", () => {
  it("lists the three required steps of a UGC testimonial, and the recommended photo", () => {
    const progress = briefProgress(empty);

    expect(progress.checks.map((c) => [c.label, c.isRequired, c.isDone])).toEqual([
      ["Name the product", true, false],
      ["Say why it matters", true, false],
      ["Cast a talent", true, false],
      ["Add a product photo", false, false],
    ]);
    expect(progress.summary).toBe("3 steps left");
    expect(progress.isReady).toBe(false);
  });

  it("counts a field as done only once it meets its minimum", () => {
    const progress = briefProgress({
      ...empty,
      productName: "L",
      benefit: "Brighter skin in two minutes",
    });

    expect(progress.checks.find((c) => c.id === "product")?.isDone).toBe(false);
    expect(progress.checks.find((c) => c.id === "benefit")?.isDone).toBe(true);
  });

  it("doesn't ask a product hero for a talent", () => {
    const progress = briefProgress({
      ...empty,
      template: "product-hero",
      productName: "LUMA",
      benefit: "Brighter skin in two minutes",
    });

    expect(progress.checks.find((c) => c.id === "talent")).toMatchObject({
      label: "No talent needed",
      isRequired: false,
    });
    expect(progress.summary).toBe("Ready to create");
  });

  it("is ready without a photo: photos are recommended, not required", () => {
    const progress = briefProgress({
      ...empty,
      productName: "LUMA",
      benefit: "Brighter skin in two minutes",
      talentId: "tal_1",
    });

    expect(progress.isReady).toBe(true);
    expect(progress.checks.find((c) => c.id === "photo")?.isDone).toBe(false);
  });
});

describe("submitStatus", () => {
  it("leads with what blocks the user, then the reassurance that it's free", () => {
    const calm = { error: null, isUploading: false, isSubmittedInvalid: false };

    expect(submitStatus({ ...calm, error: "Too many requests" })).toEqual({
      text: "Too many requests",
      isAlert: true,
    });
    expect(submitStatus({ ...calm, isUploading: true }).text).toMatch(/uploading/);
    expect(submitStatus({ ...calm, isSubmittedInvalid: true }).isAlert).toBe(true);
    expect(submitStatus(calm).text).toBe("Free · storyboards in about a minute");
  });
});

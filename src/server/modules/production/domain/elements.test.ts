import { describe, expect, it } from "vitest";

import { MAX_ELEMENT_PHOTOS, videoElements } from "./elements";

describe("videoElements", () => {
  it("puts the talent first and the product second", () => {
    expect(videoElements({ talent: ["t1", "t2"], product: ["p1"] })).toEqual([
      { role: "talent", imageUrls: ["t1", "t2"] },
      { role: "product", imageUrls: ["p1"] },
    ]);
  });

  it("leaves out whoever has no photos", () => {
    expect(videoElements({ talent: [], product: ["p1"] })).toEqual([
      { role: "product", imageUrls: ["p1"] },
    ]);
    expect(videoElements({ talent: [], product: [] })).toEqual([]);
  });

  it("keeps each element within the model's photo limit, best first", () => {
    const many = ["a", "b", "c", "d", "e", "f"];
    const [talent] = videoElements({ talent: many, product: [] });

    expect(talent?.imageUrls).toEqual(many.slice(0, MAX_ELEMENT_PHOTOS));
  });
});

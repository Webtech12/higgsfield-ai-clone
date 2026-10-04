import { describe, expect, it } from "vitest";

import { fitWithin } from "./downscale";

describe("fitWithin", () => {
  it("shrinks the long edge to the limit and keeps the proportions", () => {
    expect(fitWithin(4032, 3024, 2000)).toEqual({ width: 2000, height: 1500 });
    expect(fitWithin(3024, 4032, 2000)).toEqual({ width: 1500, height: 2000 });
  });

  it("never enlarges a small photo", () => {
    expect(fitWithin(800, 600, 2000)).toEqual({ width: 800, height: 600 });
  });
});

import { describe, expect, it } from "vitest";

import { shotFilename } from "./project";

describe("shotFilename", () => {
  it("slugs the film's title and keeps the clip's real extension", () => {
    expect(shotFilename("Salt & Static: Part II", 3, "https://cdn/x/clip.MP4?sig=1")).toBe(
      "salt-static-part-ii-shot-3.mp4",
    );
    expect(shotFilename("First Light, First Step", 1, "/fake-media/clip-16x9-1.webm")).toBe(
      "first-light-first-step-shot-1.webm",
    );
  });

  it("falls back to a plain name and mp4 when there's nothing to go on", () => {
    expect(shotFilename("!!!", 1, "/clip")).toBe("film-shot-1.mp4");
  });
});

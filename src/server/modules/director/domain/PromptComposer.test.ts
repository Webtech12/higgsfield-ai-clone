import { describe, expect, it } from "vitest";

import { composeFramePrompt, composeVideoPrompt, type PromptContext } from "./PromptComposer";

const context: PromptContext = {
  elements: {
    character: "an old lighthouse keeper in a yellow raincoat",
    location: "a storm-battered lighthouse",
    style: "grainy 16mm",
  },
  direction: { name: "Quiet", look: "muted teal and amber" },
  shot: {
    description: "She finds a green bottle wedged between the rocks",
    cameraMove: "crash-zoom",
    lighting: "last light of dusk",
    mood: "hushed wonder",
  },
  aspectRatio: "9:16",
};

describe("PromptComposer", () => {
  it("puts the continuity elements into every frame prompt", () => {
    const prompt = composeFramePrompt(context);

    expect(prompt).toContain("an old lighthouse keeper in a yellow raincoat");
    expect(prompt).toContain("a storm-battered lighthouse");
    expect(prompt).toContain("grainy 16mm");
    expect(prompt).toContain("vertical composition");
  });

  it("renders the camera move as motion text in the video prompt only", () => {
    expect(composeVideoPrompt(context)).toContain("crash zoom");
    expect(composeFramePrompt(context)).not.toContain("crash zoom");
  });

  it("never produces doubled full stops", () => {
    const prompt = composeFramePrompt({
      ...context,
      shot: { ...context.shot, description: "Ends with a stop." },
    });

    expect(prompt).not.toContain("..");
  });
});

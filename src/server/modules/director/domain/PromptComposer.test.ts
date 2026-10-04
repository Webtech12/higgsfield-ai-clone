import { describe, expect, it } from "vitest";

import {
  composeFramePrompt,
  composeVideoNegativePrompt,
  composeVideoPrompt,
  describeReferences,
  NO_REFERENCES,
  type PromptContext,
} from "./PromptComposer";

const context: PromptContext = {
  elements: {
    character: "the talent in a cream linen shirt, morning routine",
    location: "a bright minimalist bathroom",
    style: "soft natural light, clean commercial look",
  },
  direction: { name: "Real Talk", look: "warm neutrals, 50mm, gentle grain" },
  shot: {
    description: "Close-up: the talent holds the product beside her cheek and smiles at the camera",
    motion: "She brings the bottle toward the lens and tilts the label into the light",
    cameraMove: "crash-zoom",
    lighting: "soft window light",
    mood: "fresh and confident",
  },
  aspectRatio: "9:16",
  references: { talent: 2, product: 1, scene: 1 },
};

describe("describeReferences", () => {
  it("names each reference photo by its position: talent, then product, then scene", () => {
    expect(describeReferences({ talent: 2, product: 1, scene: 1 })).toEqual([
      "The talent is the person in images 1–2: keep their face, hair, skin tone and build exactly",
      "The product is the one in image 3: keep its shape, colours, materials and label text exactly",
      "Use image 4 as the reference for the location",
    ]);
  });

  it("numbers the product from 1 when no talent is cast", () => {
    expect(describeReferences({ talent: 0, product: 2, scene: 0 })).toEqual([
      "The product is the one in images 1–2: keep its shape, colours, materials and label text exactly",
    ]);
  });

  it("says nothing when there are no photos", () => {
    expect(describeReferences(NO_REFERENCES)).toEqual([]);
  });
});

describe("composeFramePrompt", () => {
  it("puts the references and the continuity elements into every frame prompt", () => {
    const prompt = composeFramePrompt(context);

    expect(prompt).toContain("The talent is the person in images 1–2");
    expect(prompt).toContain("a bright minimalist bathroom");
    expect(prompt).toContain("cream linen shirt");
    expect(prompt).toContain("vertical composition");
  });

  it("allows the product's own label but no other text", () => {
    expect(composeFramePrompt(context)).toContain("the only lettering is the product's own label");
    expect(composeFramePrompt({ ...context, references: NO_REFERENCES })).toContain(
      "No text, captions or watermarks",
    );
  });

  it("keeps the camera move out of the still", () => {
    expect(composeFramePrompt(context)).not.toContain("crash zoom");
  });

  it("asks for an unretouched real photograph, not the glossy look of an AI ad (ADR-026)", () => {
    const prompt = composeFramePrompt(context);
    const widescreen = composeFramePrompt({ ...context, aspectRatio: "16:9" });

    expect(prompt).toContain("A real, unretouched photograph");
    expect(prompt).toContain("no airbrushed or plastic skin");
    expect(prompt).not.toContain("photorealistic commercial photography");
    expect(widescreen).toContain("widescreen composition");
    expect(widescreen).not.toContain("cinematic");
  });

  it("never produces doubled full stops", () => {
    const prompt = composeFramePrompt({
      ...context,
      shot: { ...context.shot, description: "Ends with a stop." },
    });

    expect(prompt).not.toContain("..");
  });
});

describe("composeVideoPrompt", () => {
  it("describes the motion and the camera move, and keeps the label readable", () => {
    const prompt = composeVideoPrompt(context);

    expect(prompt).toContain("She brings the bottle toward the lens");
    expect(prompt).toContain("crash zoom");
    expect(prompt).toContain("label sharp and readable");
  });

  it("falls back to the description for films planned before ads", () => {
    const prompt = composeVideoPrompt({
      ...context,
      shot: { ...context.shot, motion: null },
      references: NO_REFERENCES,
    });

    expect(prompt).toContain("Close-up: the talent holds the product");
    expect(prompt).toContain("consistent with the first frame");
  });

  it("asks for real footage with steady faces and hands", () => {
    const prompt = composeVideoPrompt(context);

    expect(prompt).toContain("Real camera footage at natural speed");
    expect(prompt).toContain("steady faces and hands");
    expect(prompt).not.toContain("Photorealistic commercial footage");
  });
});

describe("composeVideoNegativePrompt", () => {
  it("lists the tells of generated footage for the model to avoid", () => {
    const negative = composeVideoNegativePrompt();

    for (const tell of ["CGI", "plastic or waxy skin", "morphing", "garbled label text"]) {
      expect(negative).toContain(tell);
    }
  });
});

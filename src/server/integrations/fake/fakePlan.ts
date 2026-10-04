import type { AspectRatio, StyleTag } from "@/contracts/brief";
import type { DirectorPlan, PlannedDirection } from "@/contracts/plan";
import type { CameraMove, ShotDuration } from "@/contracts/project";

import { hashString, pick } from "../hash";

/**
 * A believable plan without an LLM: three archetypal directions, each telling the idea in three
 * beats (set-up, turn, reveal). Deterministic per brief, so tests and demos are repeatable.
 */

interface Archetype {
  name: string;
  tagline: string;
  look: string;
  moves: readonly [CameraMove, CameraMove, CameraMove];
  lighting: readonly [string, string, string];
  moods: readonly [string, string, string];
}

const ARCHETYPES: readonly Archetype[] = [
  {
    name: "Quiet Realism",
    tagline: "Observed, intimate and true to life, as if we happened to be there.",
    look: "naturalistic 35mm, soft window light, muted earth tones",
    moves: ["static", "handheld", "dolly-in"],
    lighting: ["overcast daylight", "practical lamp glow", "last light of dusk"],
    moods: ["still", "tender", "quietly charged"],
  },
  {
    name: "Bold & Graphic",
    tagline: "Big shapes, hard light and confident camera moves that sell the moment.",
    look: "high-contrast graphic frames, saturated primaries, crisp anamorphic",
    moves: ["crane-up", "orbit", "crash-zoom"],
    lighting: ["hard midday sun", "neon rim light", "single hard key light"],
    moods: ["confident", "electric", "triumphant"],
  },
  {
    name: "Dreamlike",
    tagline: "Soft, strange and floating, the idea remembered rather than recorded.",
    look: "hazy pastel palette, soft focus edges, drifting particles",
    moves: ["dolly-out", "fpv", "tilt-up"],
    lighting: ["blue hour haze", "backlit silhouette", "glowing volumetric light"],
    moods: ["wistful", "weightless", "uncanny"],
  },
];

const STYLE_LOOKS = {
  noir: "high-contrast black and white noir",
  dreamy: "soft pastel dream haze",
  documentary: "documentary realism",
  commercial: "polished commercial gloss",
  anime: "cel-shaded anime",
  retro: "faded 1970s film stock",
} satisfies Record<StyleTag, string>;

const BEATS = [
  {
    title: "Set-up",
    frame: (idea: string) => `Opening image that establishes the world of: ${idea}`,
  },
  { title: "Turn", frame: (idea: string) => `The moment everything changes in: ${idea}` },
  { title: "Reveal", frame: (idea: string) => `The final image that lands the idea of: ${idea}` },
] as const;

const DURATIONS: readonly ShotDuration[] = [4, 5, 6];

export function buildFakePlan(input: {
  idea: string;
  aspectRatio: AspectRatio;
  styles: StyleTag[];
}): DirectorPlan {
  const idea = input.idea.trim().replace(/\s+/g, " ").slice(0, 160);
  const seed = hashString(idea);
  const styleLook = input.styles.map((style) => STYLE_LOOKS[style]).join(", ");

  const directions = ARCHETYPES.map((archetype, d): PlannedDirection => ({
    name: archetype.name,
    tagline: archetype.tagline,
    look: styleLook ? `${archetype.look}, ${styleLook}` : archetype.look,
    shots: [0, 1, 2].map((s) => {
      const beat = BEATS[s] ?? BEATS[0];
      return {
        title: beat.title,
        description: beat.frame(idea),
        cameraMove: archetype.moves[s] ?? "static",
        durationS: pick(DURATIONS, seed + d + s),
        lighting: archetype.lighting[s] ?? archetype.lighting[0],
        mood: archetype.moods[s] ?? archetype.moods[0],
      };
    }),
  }));

  return {
    title: titleFrom(idea),
    elements: {
      character: "the central figure of the story",
      location: "the place where the story unfolds",
      style: styleLook || "cinematic 35mm film",
    },
    directions,
  };
}

const TRAILING_FILLERS = new Set([
  "a",
  "an",
  "the",
  "of",
  "in",
  "on",
  "from",
  "to",
  "with",
  "and",
  "her",
  "his",
]);

function titleFrom(idea: string): string {
  const words = idea
    .replace(/[^\p{L}\p{N}\s'-]/gu, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 5);
  // Don't end a title mid-phrase ("A Lighthouse Keeper Finds A").
  while (words.length > 1 && TRAILING_FILLERS.has((words.at(-1) ?? "").toLowerCase())) words.pop();
  const title = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return title || "Untitled film";
}

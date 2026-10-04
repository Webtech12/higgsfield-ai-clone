import { AD_TEMPLATES, ON_SCREEN_LIMITS, type AdBriefFields } from "@/contracts/ad";
import type { DirectorPlan, PlannedDirection } from "@/contracts/plan";
import type { CameraMove, ShotDuration } from "@/contracts/project";
import type { PlanningRequest } from "@/server/modules/director";

import { hashString, pick } from "../hash";

/**
 * A believable ad plan without an LLM: three archetypal concepts, each telling the brief's template
 * in its three beats. Deterministic per brief, so tests and demos are repeatable.
 */

interface Archetype {
  name: string;
  tagline: (brief: AdBriefFields) => string;
  look: string;
  moves: readonly [CameraMove, CameraMove, CameraMove];
  lighting: readonly [string, string, string];
  moods: readonly [string, string, string];
  music: string;
}

const ARCHETYPES: readonly Archetype[] = [
  {
    name: "Real Talk",
    tagline: (b) => `An honest, first-person take on ${b.productName}.`,
    look: "natural daylight, 35mm, gentle handheld texture, warm neutrals",
    moves: ["handheld", "dolly-in", "static"],
    lighting: ["soft window light", "bright daylight", "warm practical light"],
    moods: ["candid", "convinced", "warm"],
    music: "Relaxed lo-fi pop, 92 BPM, soft keys, finger snaps and a mellow bass",
  },
  {
    name: "Studio Gloss",
    tagline: (b) => `${b.productName} as an object of desire.`,
    look: "seamless studio set, crisp key light, 85mm, glossy highlights",
    moves: ["crash-zoom", "orbit", "dolly-out"],
    lighting: ["hard key light", "rim light on a dark set", "clean high-key light"],
    moods: ["bold", "precise", "premium"],
    music: "Sleek electronic, 118 BPM, deep bass, bright plucks and a crisp clap",
  },
  {
    name: "Golden Hour",
    tagline: (b) => `${b.productName} in the moment that matters.`,
    look: "warm sunset palette, 50mm, soft lens flare, shallow depth of field",
    moves: ["dolly-in", "crane-up", "tilt-up"],
    lighting: ["low golden sun", "warm backlight", "last light of dusk"],
    moods: ["hopeful", "free", "glowing"],
    music: "Uplifting indie pop, 104 BPM, acoustic guitar, claps and a warm synth pad",
  },
];

const DURATIONS: readonly ShotDuration[] = [4, 5, 6];

const clip = (text: string, max: number) =>
  text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;

export function buildFakePlan(request: PlanningRequest): DirectorPlan {
  const { brief, template, talent } = request;
  const seed = hashString(`${brief.productName}|${brief.benefit}`);
  const subject = talent ? "the talent" : "the product";

  const directions = ARCHETYPES.map((archetype, d): PlannedDirection => ({
    name: archetype.name,
    tagline: clip(archetype.tagline(brief), 160),
    look: archetype.look,
    hook: clip(template.beats[0] ?? "A striking opening", 160),
    headline: clip(brief.benefit, ON_SCREEN_LIMITS.headline),
    cta: clip(brief.cta || `Shop ${brief.productName}`, ON_SCREEN_LIMITS.cta),
    musicBrief: archetype.music,
    shots: [0, 1, 2].map((s) => {
      const beat = template.beats[s] ?? "Payoff";
      return {
        title: beat.split(":")[0] ?? "Shot",
        description: clip(`${beat}, with ${subject} and ${brief.productName} in frame`, 400),
        motion: clip(`${subject} moves naturally as ${brief.productName} catches the light`, 300),
        cameraMove: archetype.moves[s] ?? "static",
        durationS: pick(DURATIONS, seed + d + s),
        lighting: archetype.lighting[s] ?? archetype.lighting[0],
        mood: archetype.moods[s] ?? archetype.moods[0],
      };
    }),
  }));

  return {
    title: clip(`${brief.productName} · ${AD_TEMPLATES[template.id].label}`, 80),
    elements: {
      character: talent
        ? "the talent, styled simply in neutral tones"
        : "no person: the product is the hero",
      location: clip(brief.sceneDirection || "a bright, modern space", 200),
      style:
        brief.moods.length > 0
          ? `${brief.moods.join(", ")} commercial look`
          : "clean commercial look",
    },
    directions,
  };
}

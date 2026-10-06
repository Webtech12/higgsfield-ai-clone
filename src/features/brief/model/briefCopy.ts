import type { AdMood, AdTextField, COACH_GAPS } from "@/contracts/ad";
import type { AspectRatio } from "@/contracts/brief";

/** Every field's words, in one place (AGENTS.md §8): the form and the coach's suggestions use them. */
interface FieldCopy {
  label: string;
  placeholder: string;
  hint: string;
  error: string;
}

export const FIELD_COPY = {
  productName: {
    // Not just "Product": that's the step's heading, and two things with one name confuse screen
    // reader users moving between fields and sections.
    label: "Product name",
    placeholder: "LUMA Vitamin C Serum",
    hint: "The name viewers should remember.",
    error: "Name the product in 2 to 60 characters.",
  },
  benefit: {
    label: "Why it matters",
    placeholder: "Brighter, more even-looking skin from a two-minute morning routine",
    hint: "The one benefit the ad should land. Concrete beats clever.",
    error: "Describe the benefit in at least 10 characters.",
  },
  audience: {
    label: "Who it's for",
    placeholder: "Busy professionals in their late 20s and 30s",
    hint: "Shapes the casting, the setting and the tone.",
    error: "Keep the audience under 160 characters.",
  },
  message: {
    label: "Key message",
    placeholder: "Glow without the fuss",
    hint: "The one idea viewers should leave with.",
    error: "Keep the key message under 200 characters.",
  },
  cta: {
    label: "Call to action",
    placeholder: "Shop now at luma.co",
    hint: "Goes on the end card: short and active.",
    error: "Keep the call to action under 40 characters.",
  },
  sceneDirection: {
    label: "Scene direction",
    placeholder:
      "A bright bathroom on a weekday morning, soft window light. She's halfway through her routine and in a hurry.",
    hint: "Where it happens, the light and what the talent does. We fill in the rest.",
    error: "Keep the scene direction under 600 characters.",
  },
} satisfies Record<AdTextField, FieldCopy>;

/** What the coach can flag as missing, in the brand's words. */
export const GAP_LABEL = {
  productName: FIELD_COPY.productName.label,
  benefit: FIELD_COPY.benefit.label,
  audience: FIELD_COPY.audience.label,
  message: FIELD_COPY.message.label,
  cta: FIELD_COPY.cta.label,
  sceneDirection: FIELD_COPY.sceneDirection.label,
  productPhoto: "A product photo",
  talent: "A talent",
} satisfies Record<(typeof COACH_GAPS)[number], string>;

export const MOOD_LABEL = {
  energetic: "Energetic",
  premium: "Premium",
  warm: "Warm",
  playful: "Playful",
  calm: "Calm",
  bold: "Bold",
  fresh: "Fresh",
  cinematic: "Cinematic",
} satisfies Record<AdMood, string>;

/** Vertical first: most ads run in social feeds. */
export const RATIO_OPTIONS = [
  { value: "9:16", label: "Vertical", where: "Reels, TikTok, Shorts" },
  { value: "1:1", label: "Square", where: "Feeds" },
  { value: "16:9", label: "Wide", where: "YouTube, web" },
] as const satisfies readonly { value: AspectRatio; label: string; where: string }[];

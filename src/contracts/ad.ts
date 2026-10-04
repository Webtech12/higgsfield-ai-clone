import { z } from "zod";

import { AspectRatio } from "./brief";

/**
 * The ad brief (ADR-024). Templates are proven ad formats: their beats shape the Director's three
 * shots, and the brief page shows them so a brand knows what each format delivers. This is the one
 * home for the template catalogue (AGENTS.md §8).
 */

export const AD_TEMPLATE_IDS = [
  "ugc-testimonial",
  "product-hero",
  "lifestyle",
  "unboxing",
  "before-after",
] as const;
export const AdTemplateId = z.enum(AD_TEMPLATE_IDS);
export type AdTemplateId = z.infer<typeof AdTemplateId>;

export interface AdTemplate {
  label: string;
  /** One line for the picker. */
  pitch: string;
  /** What each of the three shots must do, in order. */
  beats: readonly [string, string, string];
  /** Whether the format needs a person on screen. */
  needsTalent: boolean;
}

export const AD_TEMPLATES = {
  "ugc-testimonial": {
    label: "UGC testimonial",
    pitch: "A creator-style recommendation that feels shot on a phone.",
    beats: [
      "Hook: the talent looks into the lens with the product in hand, mid-reaction",
      "Proof: the product in use, close and honest",
      "Payoff: the talent's verdict, product to camera",
    ],
    needsTalent: true,
  },
  "product-hero": {
    label: "Product hero",
    pitch: "The product as the star: light, texture and motion.",
    beats: [
      "Hook: a striking reveal of the product",
      "Detail: the material or feature that matters, in close-up",
      "Packshot: the product in its best light, with room for the call to action",
    ],
    needsTalent: false,
  },
  lifestyle: {
    label: "Lifestyle",
    pitch: "The product woven into a moment the audience wants to live.",
    beats: [
      "Hook: the talent in an aspirational everyday moment",
      "Use: the product making that moment better",
      "Payoff: the feeling it leaves, product in frame",
    ],
    needsTalent: true,
  },
  unboxing: {
    label: "Unboxing",
    pitch: "Anticipation, the reveal and a first impression.",
    beats: [
      "Hook: the package is opened, hands and anticipation",
      "Reveal: the product comes out and the talent reacts",
      "First use: the talent tries it, product clearly visible",
    ],
    needsTalent: true,
  },
  "before-after": {
    label: "Before / after",
    pitch: "The everyday problem, the product, the difference.",
    beats: [
      "Before: the everyday problem, shown rather than told",
      "The switch: the talent reaches for the product",
      "After: the talent with the product, the difference visible but honest",
    ],
    needsTalent: true,
  },
} as const satisfies Record<AdTemplateId, AdTemplate>;

/** Optional tone chips: hints for the Director, never a model choice. */
export const AD_MOODS = [
  "energetic",
  "premium",
  "warm",
  "playful",
  "calm",
  "bold",
  "fresh",
  "cinematic",
] as const;
export const AdMood = z.enum(AD_MOODS);
export type AdMood = z.infer<typeof AdMood>;
export const AD_MAX_MOODS = 3;

/** On-screen text in the finished ad: short enough to read in a second on a phone. */
export const ON_SCREEN_LIMITS = { headline: 48, cta: 40 } as const;

/** Field lengths, shared by the form, the API and the coach's suggestions. */
export const AD_FIELD_LIMITS = {
  productName: { min: 2, max: 60 },
  benefit: { min: 10, max: 300 },
  audience: { min: 0, max: 160 },
  message: { min: 0, max: 200 },
  cta: { min: 0, max: 40 },
  sceneDirection: { min: 0, max: 600 },
} as const;
export type AdTextField = keyof typeof AD_FIELD_LIMITS;
export const AD_TEXT_FIELDS = Object.keys(AD_FIELD_LIMITS) as AdTextField[];

const text = (field: AdTextField) =>
  z.string().trim().min(AD_FIELD_LIMITS[field].min).max(AD_FIELD_LIMITS[field].max);

/** What the brand writes. Empty optional fields are empty strings, which forms handle simply. */
export const AdBriefFields = z.object({
  template: AdTemplateId,
  productName: text("productName"),
  benefit: text("benefit"),
  audience: text("audience"),
  message: text("message"),
  cta: text("cta"),
  moods: z.array(AdMood).max(AD_MAX_MOODS),
  sceneDirection: text("sceneDirection"),
});
export type AdBriefFields = z.infer<typeof AdBriefFields>;

/** Brand photos: what the product looks like, and optionally where the ad takes place. */
export const REFERENCE_ROLES = ["product", "scene"] as const;
export const ReferenceRole = z.enum(REFERENCE_ROLES);
export type ReferenceRole = z.infer<typeof ReferenceRole>;
export const REFERENCE_LIMITS = { product: 3, scene: 2 } satisfies Record<ReferenceRole, number>;

export const AdReferenceInput = z.object({ uploadId: z.string().min(1), role: ReferenceRole });
export type AdReferenceInput = z.infer<typeof AdReferenceInput>;

/** POST /api/v1/projects: the full brief, with the cast and the photos it uses. */
export const AdBriefInput = AdBriefFields.extend({
  talentId: z.string().min(1).nullable(),
  references: z.array(AdReferenceInput).max(REFERENCE_LIMITS.product + REFERENCE_LIMITS.scene),
  aspectRatio: AspectRatio,
}).superRefine((brief, ctx) => {
  if (AD_TEMPLATES[brief.template].needsTalent && !brief.talentId) {
    ctx.addIssue({
      code: "custom",
      path: ["talentId"],
      message: `Pick a talent: a ${AD_TEMPLATES[brief.template].label} needs a person on screen`,
    });
  }
  for (const role of REFERENCE_ROLES) {
    if (brief.references.filter((r) => r.role === role).length > REFERENCE_LIMITS[role]) {
      ctx.addIssue({
        code: "custom",
        path: ["references"],
        message: `Up to ${String(REFERENCE_LIMITS[role])} ${role} photos`,
      });
    }
  }
});
export type AdBriefInput = z.infer<typeof AdBriefInput>;

// --- Polish with AI (the brief coach) ------------------------------------------------------------

/** The brief's text as typed so far: any field may still be empty. */
export const CoachDraftFields = z.object({
  template: AdTemplateId,
  productName: z.string().trim().max(AD_FIELD_LIMITS.productName.max),
  benefit: z.string().trim().max(AD_FIELD_LIMITS.benefit.max),
  audience: text("audience"),
  message: text("message"),
  cta: text("cta"),
  moods: z.array(AdMood).max(AD_MAX_MOODS),
  sceneDirection: text("sceneDirection"),
});

/** POST /api/v1/coach: a draft the coach can work with, as long as something is written. */
export const CoachDraft = CoachDraftFields.extend({
  talentId: z.string().min(1).nullable(),
  productPhotoCount: z.number().int().min(0).max(REFERENCE_LIMITS.product),
}).refine((draft) => Boolean(draft.productName || draft.benefit || draft.sceneDirection), {
  message: "Write something about the product first",
});
export type CoachDraft = z.infer<typeof CoachDraft>;

/** What the coach can flag as missing: a text field, the product photo or the talent. */
export const COACH_GAPS = [...AD_TEXT_FIELDS, "productPhoto", "talent"] as const;

export const CoachSuggestion = z.object({
  field: z.enum(AD_TEXT_FIELDS as [AdTextField, ...AdTextField[]]),
  value: z.string().min(1).max(600),
  why: z.string().min(1).max(200),
});
export type CoachSuggestion = z.infer<typeof CoachSuggestion>;

export const CoachResult = z.object({
  suggestions: z.array(CoachSuggestion).max(6),
  missing: z.array(z.object({ field: z.enum(COACH_GAPS), why: z.string().min(1).max(200) })).max(6),
  tips: z.array(z.string().min(1).max(200)).max(3),
});
export type CoachResult = z.infer<typeof CoachResult>;

/** True when a suggestion fits the field it's for, so applying it can't break the form. */
export function fitsField(suggestion: CoachSuggestion): boolean {
  const { min, max } = AD_FIELD_LIMITS[suggestion.field];
  const length = suggestion.value.trim().length;
  return length >= Math.max(min, 1) && length <= max;
}

import { AD_TEMPLATES, type AdBriefInput, type CoachDraft } from "@/contracts/ad";

/** A fresh brief: a UGC testimonial for vertical feeds, the format most ads start from. */
export const BRIEF_DEFAULTS: AdBriefInput = {
  template: "ugc-testimonial",
  productName: "",
  benefit: "",
  audience: "",
  message: "",
  cta: "",
  moods: [],
  sceneDirection: "",
  talentId: null,
  references: [],
  aspectRatio: "9:16",
};

/** What the coach reads: the text so far, the cast and how many product photos there are. */
export function toCoachDraft(brief: AdBriefInput): CoachDraft {
  return {
    template: brief.template,
    productName: brief.productName.trim(),
    benefit: brief.benefit.trim(),
    audience: brief.audience.trim(),
    message: brief.message.trim(),
    cta: brief.cta.trim(),
    moods: brief.moods,
    sceneDirection: brief.sceneDirection.trim(),
    talentId: brief.talentId,
    productPhotoCount: brief.references.filter((r) => r.role === "product").length,
  };
}

/** The coach needs something to read: a product name, a benefit or a scene. */
export const canCoach = (
  brief: Pick<AdBriefInput, "productName" | "benefit" | "sceneDirection">,
): boolean =>
  Boolean(brief.productName.trim() || brief.benefit.trim() || brief.sceneDirection.trim());

/** Switching to a format without a person keeps the cast; switching back needs one again. */
export const needsTalent = (brief: Pick<AdBriefInput, "template">): boolean =>
  AD_TEMPLATES[brief.template].needsTalent;

/** "Hook" from "Hook: the talent looks into the lens…" */
export const beatName = (beat: string): string => beat.split(":")[0]?.trim() ?? beat;

/** "the talent looks into the lens…" from "Hook: the talent looks into the lens…" */
export const beatDetail = (beat: string): string => beat.split(":").slice(1).join(":").trim();

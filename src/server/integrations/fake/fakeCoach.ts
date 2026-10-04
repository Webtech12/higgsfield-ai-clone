import { AD_FIELD_LIMITS, fitsField, type CoachResult, type CoachSuggestion } from "@/contracts/ad";
import type { CoachRequest } from "@/server/modules/director";

/**
 * Deterministic coaching without an LLM: rules a strategist would apply, so the Polish with AI flow
 * can be built and tested on fakes. It never adds claims the draft doesn't make.
 */
export function buildFakeCoach(request: CoachRequest): CoachResult {
  return {
    suggestions: suggestionsFor(request).filter(fitsField),
    missing: gapsIn(request),
    tips: ["The first two seconds decide whether people keep watching: open on the hook."],
  };
}

function suggestionsFor({ draft, template }: CoachRequest): CoachSuggestion[] {
  const suggestions: CoachSuggestion[] = [];
  if (draft.productName && !draft.cta) {
    suggestions.push({
      field: "cta",
      value: `Try ${draft.productName} today`.slice(0, AD_FIELD_LIMITS.cta.max),
      why: "A short imperative tells viewers exactly what to do next.",
    });
  }
  if (draft.benefit && !draft.message) {
    suggestions.push({
      field: "message",
      value: `${draft.benefit.replace(/[.!]+$/, "")}.`.slice(0, AD_FIELD_LIMITS.message.max),
      why: "One clear idea is easier to remember than several.",
    });
  }
  if (!draft.sceneDirection) {
    const hook = (template.beats[0] ?? "open on the hook").toLowerCase();
    suggestions.push({
      field: "sceneDirection",
      value: `A bright, lived-in space at golden hour; ${hook}.`,
      why: "A concrete place, light and action gives the frames a strong starting point.",
    });
  }
  return suggestions;
}

function gapsIn({ draft, template, talent, photos }: CoachRequest): CoachResult["missing"] {
  const missing: CoachResult["missing"] = [];
  if (!draft.audience) {
    missing.push({ field: "audience", why: "Who it's for shapes the setting, styling and tone." });
  }
  if (photos.product === 0) {
    missing.push({
      field: "productPhoto",
      why: "A product photo keeps the label and shape exact.",
    });
  }
  if (template.needsTalent && !talent) {
    missing.push({ field: "talent", why: `A ${template.label} needs a person on screen.` });
  }
  return missing;
}

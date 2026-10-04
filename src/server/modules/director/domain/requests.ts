import { z } from "zod";

import { AD_TEMPLATES, AdBriefFields, AdTemplateId, CoachDraftFields } from "@/contracts/ad";
import { AspectRatio } from "@/contracts/brief";

/**
 * What the Director sends the LLM, as JSON in the user message. One schema per call, shared with the
 * fake LLM so both sides of the conversation agree on its shape. The talent is described by persona
 * only: their photos reach the frame model, and their name never reaches a prompt (ADR-024).
 */

const TemplateContext = z.object({
  id: AdTemplateId,
  label: z.string(),
  beats: z.array(z.string()).length(3),
  needsTalent: z.boolean(),
});

export const templateContext = (id: AdTemplateId): z.infer<typeof TemplateContext> => {
  const template = AD_TEMPLATES[id];
  return {
    id,
    label: template.label,
    beats: [...template.beats],
    needsTalent: template.needsTalent,
  };
};

const TalentContext = z.object({ persona: z.string() }).nullable();

export const PlanningRequest = z.object({
  template: TemplateContext,
  brief: AdBriefFields,
  aspectRatio: AspectRatio,
  talent: TalentContext,
  photos: z.object({ product: z.number().int(), scene: z.number().int() }),
});
export type PlanningRequest = z.infer<typeof PlanningRequest>;

export const CoachRequest = z.object({
  template: TemplateContext,
  draft: CoachDraftFields.omit({ template: true }),
  talent: TalentContext,
  photos: z.object({ product: z.number().int() }),
});
export type CoachRequest = z.infer<typeof CoachRequest>;

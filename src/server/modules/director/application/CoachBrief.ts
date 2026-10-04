import { CoachResult, fitsField, type CoachDraft } from "@/contracts/ad";
import type { TalentApi } from "@/server/modules/talent";

import { COACH_SYSTEM_PROMPT } from "../domain/prompts";
import { templateContext, type CoachRequest } from "../domain/requests";
import type { LLMProvider } from "../ports/LLMProvider";

/**
 * Polish with AI: the Director reads a draft brief and suggests sharper fields, what's missing and a
 * few tips, before anything is generated (ADR-024). Free and rate-limited by the caller.
 */
export class CoachBrief {
  constructor(private readonly d: { llm: LLMProvider; talent: TalentApi }) {}

  async execute(draft: CoachDraft): Promise<CoachResult> {
    const { template, talentId, productPhotoCount, ...fields } = draft;
    const cast = talentId ? await this.d.talent.getCasting(talentId) : null;
    const request: CoachRequest = {
      template: templateContext(template),
      draft: fields,
      talent: cast ? { persona: cast.persona } : null,
      photos: { product: productPhotoCount },
    };
    const raw = await this.d.llm.structured({
      purpose: "coach",
      system: COACH_SYSTEM_PROMPT,
      input: JSON.stringify(request),
      schema: CoachResult,
    });
    const result = CoachResult.parse(raw);
    // A suggestion that doesn't fit its field would break the form when applied: drop it.
    return { ...result, suggestions: result.suggestions.filter(fitsField) };
  }
}

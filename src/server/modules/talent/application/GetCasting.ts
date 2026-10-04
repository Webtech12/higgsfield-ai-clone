import {
  toCasting,
  TalentUnavailableError,
  type Casting,
  type TalentRecord,
} from "../domain/casting";

export interface TalentReader {
  find(talentId: string): Promise<TalentRecord | null>;
}

/**
 * The talent's photos and persona for a brief, a plan or a frame. Every generation goes through
 * here, so a talent deactivated after their consent ended is never used again (ADR-024).
 */
export class GetCasting {
  constructor(private readonly d: { talent: TalentReader }) {}

  async execute(talentId: string): Promise<Casting> {
    const record = await this.d.talent.find(talentId);
    if (!record) throw new TalentUnavailableError("That talent isn't on the roster");
    return toCasting(record);
  }
}

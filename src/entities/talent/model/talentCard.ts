import type { TalentPhoto, TalentView } from "@/contracts/talent";

/** What a talent card and profile show: no raw DTOs in components (AGENTS.md §7). */
export interface TalentCardModel {
  id: string;
  name: string;
  tagline: string;
  bio: string;
  /** The first three tags: enough to scan a roster. */
  tags: string[];
  cover: TalentPhoto;
  photos: TalentPhoto[];
  /** "Release signed 4 Oct 2026" */
  consentLine: string;
  consentScope: string;
}

/** A fixed locale and time zone, so the server and the browser print the same date. */
const SIGNED_ON = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function toTalentCard(talent: TalentView): TalentCardModel {
  const [cover = { url: "", alt: talent.name }] = talent.photos;
  return {
    id: talent.id,
    name: talent.name,
    tagline: talent.tagline,
    bio: talent.bio,
    tags: talent.tags.slice(0, 3),
    cover,
    photos: talent.photos,
    consentLine: `Release signed ${SIGNED_ON.format(new Date(`${talent.consent.signedOn}T00:00:00Z`))}`,
    consentScope: talent.consent.scope,
  };
}

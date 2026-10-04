import type { TalentPhoto } from "@/contracts/talent";
import { DomainError } from "@/server/platform/errors";

/** A talent who can't be cast: unknown, or deactivated because their consent ended (ADR-024). */
export class TalentUnavailableError extends DomainError {
  readonly code = "TALENT_UNAVAILABLE";
}

/** A roster entry as the talent module stores it. */
export interface TalentRecord {
  id: string;
  name: string;
  tagline: string;
  bio: string;
  tags: string[];
  photos: TalentPhoto[];
  isActive: boolean;
}

/** What generation needs to put a talent in an ad. */
export interface Casting {
  talentId: string;
  name: string;
  /** Who they are, for the Director: tagline, bio and tags. */
  persona: string;
  /** Reference photos for the frame model, best first. */
  photoUrls: string[];
}

/** Frame models take up to ten references; the talent's share leaves room for the product. */
export const MAX_CASTING_PHOTOS = 3;

export function toCasting(record: TalentRecord): Casting {
  if (!record.isActive) throw new TalentUnavailableError(`${record.name} isn't available any more`);
  const tags = record.tags.length > 0 ? ` Known for: ${record.tags.join(", ")}.` : "";
  return {
    talentId: record.id,
    name: record.name,
    persona: `${record.tagline}. ${record.bio}${tags}`.replace(/\.\./g, "."),
    photoUrls: record.photos.slice(0, MAX_CASTING_PHOTOS).map((photo) => photo.url),
  };
}

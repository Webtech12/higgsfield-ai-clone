import "server-only";

import { asc, eq } from "drizzle-orm";

import type { TalentView } from "@/contracts/talent";
import { talents } from "@/server/modules/talent/infrastructure/schema";
import type { Reader } from "@/server/platform/db";

/** The roster brands cast from: active talent only, in their display order (ADR-024). */
export async function listTalent(db: Reader): Promise<TalentView[]> {
  const rows = await db
    .select()
    .from(talents)
    .where(eq(talents.isActive, true))
    .orderBy(asc(talents.sortOrder), asc(talents.name));
  return rows.flatMap((row) =>
    row.photos.length === 0
      ? []
      : [
          {
            id: row.id,
            slug: row.slug,
            name: row.name,
            tagline: row.tagline,
            bio: row.bio,
            tags: row.tags,
            photos: row.photos,
            consent: { signedOn: row.consentSignedOn, scope: row.consentScope },
          },
        ],
  );
}

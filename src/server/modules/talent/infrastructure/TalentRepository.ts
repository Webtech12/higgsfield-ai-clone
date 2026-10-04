import "server-only";

import { eq } from "drizzle-orm";

import type { Database } from "@/server/platform/db";

import type { TalentReader } from "../application/GetCasting";
import type { TalentRecord } from "../domain/casting";
import { talents } from "./schema";

export class TalentRepository implements TalentReader {
  constructor(private readonly db: Database) {}

  async find(talentId: string): Promise<TalentRecord | null> {
    const [row] = await this.db.select().from(talents).where(eq(talents.id, talentId));
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      tagline: row.tagline,
      bio: row.bio,
      tags: row.tags,
      photos: row.photos,
      isActive: row.isActive,
    };
  }
}

import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import type { Database } from "@/server/platform/db";

import { uploads } from "./schema";

export interface UploadRecord {
  id: string;
  userId: string;
  url: string;
  contentType: string;
  sizeBytes: number;
}

export class UploadRepository {
  constructor(private readonly db: Database) {}

  async insert(upload: UploadRecord): Promise<void> {
    await this.db.insert(uploads).values(upload);
  }

  /** Only the user's own uploads: an id from another user simply isn't found. */
  async findOwned(userId: string, ids: readonly string[]): Promise<Map<string, UploadRecord>> {
    if (ids.length === 0) return new Map();
    const rows = await this.db
      .select()
      .from(uploads)
      .where(and(eq(uploads.userId, userId), inArray(uploads.id, [...ids])));
    return new Map(rows.map((row) => [row.id, row]));
  }
}

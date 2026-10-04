// media: durable storage for provider outputs and brand photos (ADR-010, ADR-023, ADR-024).
import type { Database } from "@/server/platform/db";

import { SaveUpload } from "./application/SaveUpload";
import { UploadRepository } from "./infrastructure/UploadRepository";
import type { ObjectStorage } from "./ports/ObjectStorage";

export { UploadRejectedError } from "./domain/upload";
export type { ObjectStorage } from "./ports/ObjectStorage";

export function createMediaModule(deps: {
  db: Database;
  storage: ObjectStorage;
  newId: (prefix: string) => string;
}) {
  const uploads = new UploadRepository(deps.db);
  const saveUpload = new SaveUpload({ storage: deps.storage, uploads, newId: deps.newId });

  return {
    persistFromUrl(input: {
      sourceUrl: string;
      projectId: string;
      assetId: string;
      extension: string;
    }): Promise<string> {
      // Random project and asset ids make keys unguessable in a public store (ADR-023).
      const key = `p/${input.projectId}/${input.assetId}.${input.extension}`;
      return deps.storage.persistFromUrl(input.sourceUrl, key);
    },
    saveUpload: saveUpload.execute.bind(saveUpload),
    /** The user's own uploads among `ids`, keyed by id; anyone else's are simply missing. */
    async getOwnedUploads(
      userId: string,
      ids: readonly string[],
    ): Promise<Map<string, { id: string; url: string }>> {
      return uploads.findOwned(userId, ids);
    },
  };
}

export type MediaApi = ReturnType<typeof createMediaModule>;

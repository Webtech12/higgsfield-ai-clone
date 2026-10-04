import { inspectUpload } from "../domain/upload";
import type { UploadRecord } from "../infrastructure/UploadRepository";
import type { ObjectStorage } from "../ports/ObjectStorage";

/** Stores a brand photo under a random key and records who uploaded it (ADR-024). */
export class SaveUpload {
  constructor(
    private readonly d: {
      storage: ObjectStorage;
      uploads: { insert(upload: UploadRecord): Promise<void> };
      newId: (prefix: string) => string;
    },
  ) {}

  async execute(command: {
    userId: string;
    bytes: Uint8Array;
  }): Promise<{ uploadId: string; url: string }> {
    const { contentType, extension } = inspectUpload(command.bytes);
    const uploadId = this.d.newId("upl");
    // The random id keeps the key unguessable in a public store (ADR-023).
    const url = await this.d.storage.put(`u/${uploadId}.${extension}`, command.bytes, contentType);
    await this.d.uploads.insert({
      id: uploadId,
      userId: command.userId,
      url,
      contentType,
      sizeBytes: command.bytes.byteLength,
    });
    return { uploadId, url };
  }
}

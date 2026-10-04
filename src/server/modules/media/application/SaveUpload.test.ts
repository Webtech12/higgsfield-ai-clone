import { describe, expect, it } from "vitest";

import { UploadRejectedError } from "../domain/upload";
import type { UploadRecord } from "../infrastructure/UploadRepository";
import { SaveUpload } from "./SaveUpload";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);

function setup() {
  const stored: { key: string; contentType: string }[] = [];
  const inserted: UploadRecord[] = [];
  const useCase = new SaveUpload({
    storage: {
      persistFromUrl: () => Promise.reject(new Error("not used")),
      put: (key, _bytes, contentType) => {
        stored.push({ key, contentType });
        return Promise.resolve(`https://cdn/${key}`);
      },
    },
    uploads: {
      insert: (upload) => {
        inserted.push(upload);
        return Promise.resolve();
      },
    },
    newId: (prefix) => `${prefix}_abc`,
  });
  return { useCase, stored, inserted };
}

describe("SaveUpload", () => {
  it("stores the photo under a random key with its real type and records its owner", async () => {
    const { useCase, stored, inserted } = setup();

    const result = await useCase.execute({ userId: "usr_1", bytes: PNG });

    expect(result).toEqual({ uploadId: "upl_abc", url: "https://cdn/u/upl_abc.png" });
    expect(stored).toEqual([{ key: "u/upl_abc.png", contentType: "image/png" }]);
    expect(inserted[0]).toMatchObject({ id: "upl_abc", userId: "usr_1", sizeBytes: PNG.length });
  });

  it("stores nothing when the file isn't a usable photo", async () => {
    const { useCase, stored, inserted } = setup();

    await expect(
      useCase.execute({ userId: "usr_1", bytes: new TextEncoder().encode("GIF89a") }),
    ).rejects.toBeInstanceOf(UploadRejectedError);
    expect(stored).toEqual([]);
    expect(inserted).toEqual([]);
  });
});

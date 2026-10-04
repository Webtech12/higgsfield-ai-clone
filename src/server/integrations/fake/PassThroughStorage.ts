import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import type { ObjectStorage } from "@/server/modules/media";

const UPLOAD_DIR = path.join(tmpdir(), "director-fake-media");
const SAFE_NAME = /^[\w.-]+$/;

/**
 * Fake-mode storage: fake media is already served by the app, so there is nothing to copy. Bytes we
 * hold (brand photos) go to a temp folder and are served by /api/fake-media/uploads, so their URLs
 * stay short wherever they're copied (assets keep their reference URLs).
 */
export class PassThroughStorage implements ObjectStorage {
  persistFromUrl(sourceUrl: string): Promise<string> {
    return Promise.resolve(sourceUrl);
  }

  async put(key: string, bytes: Uint8Array): Promise<string> {
    const name = key.replaceAll("/", "_");
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, name), bytes);
    return `/api/fake-media/uploads/${name}`;
  }
}

/** A stored fake upload, or null for a name we never wrote. */
export async function readFakeUpload(name: string): Promise<Uint8Array | null> {
  if (!SAFE_NAME.test(name)) return null;
  try {
    return await readFile(path.join(UPLOAD_DIR, name));
  } catch {
    return null;
  }
}

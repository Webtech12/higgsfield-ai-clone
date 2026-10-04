import type { ObjectStorage } from "@/server/modules/media";

/** Fake-mode storage: fake media is already served by the app, so there is nothing to copy. */
export class PassThroughStorage implements ObjectStorage {
  persistFromUrl(sourceUrl: string): Promise<string> {
    return Promise.resolve(sourceUrl);
  }

  /** Fake media is same-origin, where the `download` attribute already works. */
  downloadUrl(publicUrl: string): string {
    return publicUrl;
  }
}

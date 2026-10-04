import { getDownloadUrl, put } from "@vercel/blob";

import type { ObjectStorage } from "@/server/modules/media";

/** Copies provider output into Vercel Blob as soon as it's ready: fal's URLs expire (ADR-023). */
export class VercelBlobStorage implements ObjectStorage {
  constructor(private readonly options: { token: string; fetchTimeoutMs: number }) {}

  async persistFromUrl(sourceUrl: string, key: string): Promise<string> {
    const response = await fetch(sourceUrl, {
      signal: AbortSignal.timeout(this.options.fetchTimeoutMs),
    });
    if (!response.ok || !response.body) {
      throw new Error(`Couldn't fetch the provider's output (HTTP ${String(response.status)})`);
    }
    const contentType = response.headers.get("content-type");
    const blob = await put(key, response.body, {
      access: "public",
      token: this.options.token,
      // A retried persist step writes the same key again; a key never holds different content.
      allowOverwrite: true,
      cacheControlMaxAge: 31_536_000,
      ...(contentType ? { contentType } : {}),
    });
    return blob.url;
  }

  /** Blob answers `?download=1` with `Content-Disposition: attachment`. */
  downloadUrl(publicUrl: string): string {
    return getDownloadUrl(publicUrl);
  }
}

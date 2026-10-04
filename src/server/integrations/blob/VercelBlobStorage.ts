import { put } from "@vercel/blob";

import type { ObjectStorage } from "@/server/modules/media";

/** A read-write token, or the store id that the SDK pairs with Vercel's OIDC token. */
export type BlobCredentials = { token: string } | { storeId: string };

/** Copies provider output into Vercel Blob as soon as it's ready: fal's URLs expire (ADR-023). */
export class VercelBlobStorage implements ObjectStorage {
  constructor(private readonly options: { credentials: BlobCredentials; fetchTimeoutMs: number }) {}

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
      ...this.options.credentials,
      // A retried persist step writes the same key again; a key never holds different content.
      allowOverwrite: true,
      cacheControlMaxAge: 31_536_000,
      ...(contentType ? { contentType } : {}),
    });
    return blob.url;
  }
}

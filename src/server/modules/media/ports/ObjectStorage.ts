/** Narrow storage port: implemented by Vercel Blob (ADR-023) and a pass-through fake. */
export interface ObjectStorage {
  /** Copies the object at `sourceUrl` under `key` and returns its public URL. */
  persistFromUrl(sourceUrl: string, key: string): Promise<string>;
  /** Stores bytes we already hold (a brand photo, a rendered overlay) and returns the public URL. */
  put(key: string, bytes: Uint8Array, contentType: string): Promise<string>;
}

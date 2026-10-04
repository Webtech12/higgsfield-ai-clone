// media: turns a provider's temporary URL into a durable one we control (ADR-010, ADR-023).

/** Narrow storage port: implemented by Vercel Blob (ADR-023) and a pass-through fake. */
export interface ObjectStorage {
  /** Copies the object at `sourceUrl` under `key` and returns its public URL. */
  persistFromUrl(sourceUrl: string, key: string): Promise<string>;
  /** The form of a public URL that makes browsers save the file instead of showing it. */
  downloadUrl(publicUrl: string): string;
}

export function createMediaModule(deps: { storage: ObjectStorage }) {
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

    /** Where a download link should land. The `download` attribute is ignored cross-origin. */
    downloadUrlFor(publicUrl: string): string {
      return deps.storage.downloadUrl(publicUrl);
    },
  };
}

export type MediaApi = ReturnType<typeof createMediaModule>;

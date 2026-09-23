// media: turns a provider's temporary URL into a durable one we control (ADR-010).

/** Narrow storage port: implemented by R2 (S4) and a pass-through fake. */
export interface ObjectStorage {
  /** Copies the object at `sourceUrl` under `key` and returns its public URL. */
  persistFromUrl(sourceUrl: string, key: string): Promise<string>;
}

export function createMediaModule(deps: { storage: ObjectStorage }) {
  return {
    persistFromUrl(input: {
      sourceUrl: string;
      projectId: string;
      assetId: string;
      extension: string;
    }): Promise<string> {
      // Random project and asset ids make keys unguessable on the public bucket (ADR-022).
      const key = `p/${input.projectId}/${input.assetId}.${input.extension}`;
      return deps.storage.persistFromUrl(input.sourceUrl, key);
    },
  };
}

export type MediaApi = ReturnType<typeof createMediaModule>;

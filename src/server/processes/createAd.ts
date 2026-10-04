import "server-only";

import type { AdBriefInput } from "@/contracts/ad";
import { UploadRejectedError, type MediaApi } from "@/server/modules/media";
import type { ProjectsApi } from "@/server/modules/projects";
import type { TalentApi } from "@/server/modules/talent";

/**
 * Brief → a new ad, ready for the Director (ADR-024). A process, not a module: it checks the brief
 * against two modules (the photos must be the user's own uploads, the talent must be castable) before
 * the projects module records it. Never trusts the ids a client sends.
 */
export function createCreateAd(deps: {
  media: MediaApi;
  talent: TalentApi;
  projects: ProjectsApi;
}) {
  return async function createAd(command: {
    userId: string;
    brief: AdBriefInput;
  }): Promise<{ projectId: string }> {
    const { talentId, references, aspectRatio, ...ad } = command.brief;
    const uploads = await deps.media.getOwnedUploads(
      command.userId,
      references.map((r) => r.uploadId),
    );
    const attached = references.map((reference) => {
      const upload = uploads.get(reference.uploadId);
      if (!upload) throw new UploadRejectedError("One of the photos isn't one of your uploads");
      return { uploadId: upload.id, url: upload.url, role: reference.role };
    });
    if (talentId) await deps.talent.getCasting(talentId);

    return deps.projects.createProject({
      userId: command.userId,
      ad,
      talentId,
      references: attached,
      aspectRatio,
    });
  };
}

export type CreateAdProcess = ReturnType<typeof createCreateAd>;

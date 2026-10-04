import { describe, expect, it, vi } from "vitest";

import type { AdBriefInput } from "@/contracts/ad";
import { UploadRejectedError, type MediaApi } from "@/server/modules/media";
import type { ProjectsApi } from "@/server/modules/projects";
import { TalentUnavailableError, type TalentApi } from "@/server/modules/talent";

import { createCreateAd } from "./createAd";

const brief: AdBriefInput = {
  template: "ugc-testimonial",
  productName: "LUMA Vitamin C Serum",
  benefit: "Brighter, more even skin in two weeks",
  audience: "",
  message: "",
  cta: "",
  moods: [],
  sceneDirection: "",
  talentId: "tal_1",
  references: [{ uploadId: "upl_mine", role: "product" }],
  aspectRatio: "9:16",
};

function setup(options: { owned?: string[]; castable?: boolean } = {}) {
  const owned = options.owned ?? ["upl_mine"];
  const media = {
    getOwnedUploads: (_userId: string, ids: readonly string[]) =>
      Promise.resolve(
        new Map(
          ids
            .filter((id) => owned.includes(id))
            .map((id) => [id, { id, url: `https://cdn/${id}` }]),
        ),
      ),
  } as unknown as MediaApi;
  const talent: TalentApi = {
    getCasting: () =>
      options.castable === false
        ? Promise.reject(new TalentUnavailableError("gone"))
        : Promise.resolve({ talentId: "tal_1", name: "Ava", persona: "p", photoUrls: [] }),
  };
  const createProject = vi.fn<ProjectsApi["createProject"]>(() =>
    Promise.resolve({ projectId: "prj_1" }),
  );
  const projects = { createProject } as unknown as ProjectsApi;
  return { createAd: createCreateAd({ media, talent, projects }), createProject };
}

describe("createAd", () => {
  it("attaches the user's own photos with their stored URLs", async () => {
    const { createAd, createProject } = setup();

    await createAd({ userId: "usr_1", brief });

    expect(createProject).toHaveBeenCalledWith(
      expect.objectContaining({
        talentId: "tal_1",
        references: [{ uploadId: "upl_mine", url: "https://cdn/upl_mine", role: "product" }],
      }),
    );
  });

  it("refuses a photo the user didn't upload", async () => {
    const { createAd, createProject } = setup({ owned: [] });

    await expect(createAd({ userId: "usr_1", brief })).rejects.toBeInstanceOf(UploadRejectedError);
    expect(createProject).not.toHaveBeenCalled();
  });

  it("refuses a talent who can't be cast", async () => {
    const { createAd, createProject } = setup({ castable: false });

    await expect(createAd({ userId: "usr_1", brief })).rejects.toBeInstanceOf(
      TalentUnavailableError,
    );
    expect(createProject).not.toHaveBeenCalled();
  });
});

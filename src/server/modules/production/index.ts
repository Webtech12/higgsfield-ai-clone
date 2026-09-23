// production (Generation Engine): assets and the workflows that make them. Public API only.
import type { MediaApi } from "@/server/modules/media";
import type { ProjectsApi } from "@/server/modules/projects";
import type { RoutingApi } from "@/server/modules/routing";
import type { Database } from "@/server/platform/db";

import { CheckGeneration, FailGeneration } from "./application/CheckGeneration";
import { RequestGeneration } from "./application/RequestGeneration";
import { SubmitGeneration } from "./application/SubmitGeneration";
import { AssetRepository } from "./infrastructure/AssetRepository";
import type { MediaProvider } from "./ports/MediaProvider";
import { createAssetGenerateWorkflow } from "./workflows/assetGenerate";

export type { GenerationOrder } from "./application/RequestGeneration";
export type { GenerationRequest, MediaProvider, ProviderStatus } from "./ports/MediaProvider";

export function createProductionModule(deps: {
  db: Database;
  provider: MediaProvider;
  routing: RoutingApi;
  media: MediaApi;
  projects: ProjectsApi;
  newId: (prefix: string) => string;
}) {
  const assets = new AssetRepository(deps.db);
  const request = new RequestGeneration({ assets, routing: deps.routing, newId: deps.newId });
  const submit = new SubmitGeneration({ assets, provider: deps.provider });
  const check = new CheckGeneration({ assets, ...deps });
  const fail = new FailGeneration({ assets });

  const api = { requestGeneration: request.execute.bind(request) };
  const workflows = [
    createAssetGenerateWorkflow({
      submit: submit.execute.bind(submit),
      check: check.execute.bind(check),
      fail: fail.execute.bind(fail),
    }),
  ];
  return { api, workflows };
}

export type ProductionApi = ReturnType<typeof createProductionModule>["api"];

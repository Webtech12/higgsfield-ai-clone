// production (Generation Engine): assets and the workflows that make them. Public API only.
import type { CreditsApi } from "@/server/modules/credits";
import type { DirectorApi } from "@/server/modules/director";
import type { LimitsApi } from "@/server/modules/limits";
import type { MediaApi } from "@/server/modules/media";
import type { ProjectsApi } from "@/server/modules/projects";
import type { RoutingApi } from "@/server/modules/routing";
import type { Database, UnitOfWork } from "@/server/platform/db";

import { CheckGeneration, FailGeneration } from "./application/CheckGeneration";
import { ProduceDirection } from "./application/ProduceDirection";
import { RequestGeneration } from "./application/RequestGeneration";
import { RetryAsset } from "./application/RetryAsset";
import { SubmitGeneration } from "./application/SubmitGeneration";
import { AssetRepository } from "./infrastructure/AssetRepository";
import type { MediaProvider } from "./ports/MediaProvider";
import { createAssetGenerateWorkflow } from "./workflows/assetGenerate";
import { createSweepWorkflow } from "./workflows/sweep";

export type { GenerationOrder } from "./application/RequestGeneration";
export type { GenerationRequest, MediaProvider, ProviderStatus } from "./ports/MediaProvider";

export function createProductionModule(deps: {
  db: Database;
  uow: UnitOfWork;
  provider: MediaProvider;
  routing: RoutingApi;
  media: MediaApi;
  projects: ProjectsApi;
  credits: CreditsApi;
  limits: LimitsApi;
  director: DirectorApi;
  newId: (prefix: string) => string;
}) {
  const assets = new AssetRepository(deps.db);
  const request = new RequestGeneration({
    assets,
    routing: deps.routing,
    limits: deps.limits,
    newId: deps.newId,
  });
  const submit = new SubmitGeneration({ assets, provider: deps.provider });
  const check = new CheckGeneration({ assets, ...deps });
  const fail = new FailGeneration({ assets, credits: deps.credits });
  const produce = new ProduceDirection({ assets, ...deps });
  const retry = new RetryAsset({ assets, ...deps });

  const api = {
    requestGeneration: request.execute.bind(request),
    produceDirection: produce.execute.bind(produce),
    retryAsset: retry.execute.bind(retry),
  };
  const workflows = [
    createAssetGenerateWorkflow({
      submit: submit.execute.bind(submit),
      check: check.execute.bind(check),
      fail: fail.execute.bind(fail),
    }),
    createSweepWorkflow({ queuedSince: (before) => assets.queuedSince(before) }),
  ];
  return { api, workflows };
}

export type ProductionApi = ReturnType<typeof createProductionModule>["api"];

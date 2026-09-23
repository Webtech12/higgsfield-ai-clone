// routing (Smart Select): picks a model for a job and prices it. Depends on nothing.
import type { AssetKind } from "@/contracts/project";

import { MODEL_REGISTRY, type ModelEntry, type ProviderName } from "./domain/modelRegistry";

export type { ModelEntry, ProviderName };

export function createRoutingModule(deps: { provider: ProviderName }) {
  const byId = new Map(MODEL_REGISTRY.map((model) => [model.id, model]));

  return {
    /** The first registered model of the active provider that can do this job (fallback order). */
    selectModel(need: { kind: AssetKind }): ModelEntry {
      const model = MODEL_REGISTRY.find(
        (m) => m.provider === deps.provider && m.kind === need.kind,
      );
      if (!model) throw new Error(`No ${deps.provider} model registered for ${need.kind}`);
      return model;
    },
    priceOf(modelId: string): number {
      const model = byId.get(modelId);
      if (!model) throw new Error(`Unknown model ${modelId}`);
      return model.creditCost;
    },
  };
}

export type RoutingApi = ReturnType<typeof createRoutingModule>;

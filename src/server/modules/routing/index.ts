// routing (Smart Select): picks a model for a job and prices it. Depends on nothing.
import type { AssetKind } from "@/contracts/project";

import { MODEL_REGISTRY, type ModelEntry, type ProviderName } from "./domain/modelRegistry";

export type { ModelEntry, ProviderName };

/** What a job needs from a model: its kind, and how many reference photos come with it. */
export interface ModelNeed {
  kind: AssetKind;
  references?: number;
}

export function createRoutingModule(deps: { provider: ProviderName }) {
  const byId = new Map(MODEL_REGISTRY.map((model) => [model.id, model]));

  /** The first registered model of the active provider that can do this job (fallback order). */
  function selectModel(need: ModelNeed): ModelEntry {
    const references = need.references ?? 0;
    const model = MODEL_REGISTRY.find(
      (m) =>
        m.provider === deps.provider &&
        m.kind === need.kind &&
        references >= m.references.min &&
        references <= m.references.max,
    );
    if (!model) {
      throw new Error(
        `No ${deps.provider} model registered for ${need.kind} with ${String(references)} reference photos`,
      );
    }
    return model;
  }

  function find(modelId: string): ModelEntry {
    const model = byId.get(modelId);
    if (!model) throw new Error(`Unknown model ${modelId}`);
    return model;
  }

  return {
    selectModel,
    priceOf: (modelId: string): number => find(modelId).creditCost,
    /** What a job costs right now, for the price on the button (AGENTS.md §1). */
    priceFor: (need: ModelNeed): number => selectModel(need).creditCost,
    /** Estimated provider cost in US cents, counted against the daily spend cap (ADR-016). */
    estimateCents: (modelId: string): number => find(modelId).providerCostCents,
  };
}

export type RoutingApi = ReturnType<typeof createRoutingModule>;

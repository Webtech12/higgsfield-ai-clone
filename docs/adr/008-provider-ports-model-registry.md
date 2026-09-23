# ADR-008: Provider ports, a model registry and Smart Select

- **Status:** Accepted
- **Date:** 2026-09-23
- **Related:** [`architecture.md`](../architecture.md) · [`standards.md`](../standards.md)

## Context

Model providers change quickly, fail, and differ in capability, cost and latency. Users shouldn't have to choose models, but advanced users may want to.

## Decision

Define `MediaProvider` and `LLMProvider` ports, implemented by adapters in `server/integrations` (fal, anthropic, fake). Every adapter passes a shared contract test suite. The routing module owns a model registry (capabilities, cost, latency, quality tier, fallback order) and a `ModelRoutingPolicy` (Smart Select) that picks a model and explains why. The same policy drives fallback.

## Alternatives considered

- **Calling vendor SDKs directly from use cases**: Vendor lock-in, untestable, and fallback logic scattered everywhere.
- **Letting users choose the model first**: Contradicts the product thesis; still available as an advanced override.

## Consequences

Vendor independence, automatic fallback, cheap tests via the fake provider, and an explainable Smart Select. The registry must be kept up to date.

## Revisit when

We add self-hosted inference (a new adapter) or routing that uses live health and cost signals.

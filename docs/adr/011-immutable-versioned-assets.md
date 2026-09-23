# ADR-011: Immutable, versioned assets separate from job attempts

- **Status:** Accepted
- **Date:** 2026-09-23
- **Related:** [`architecture.md`](../architecture.md) · [`standards.md`](../standards.md)

## Context

Remixing must not destroy previous work. Retries and provider fallbacks create multiple attempts for one user-visible output.

## Decision

An `Asset` is an immutable user-visible version (frame or video) with a `version` and a `parent_asset_id` (remix lineage). A `GenerationJob` is one attempt on a specific provider and model. Each shot points at its current frame and video assets. The asset lifecycle is a table-driven state machine with optimistic locking.

## Alternatives considered

- **Overwriting assets in place**: Destroys history and makes retries unsafe.

## Consequences

Free version history, safe retries, and per-attempt cost accounting. More rows, which is acceptable.

## Revisit when

—

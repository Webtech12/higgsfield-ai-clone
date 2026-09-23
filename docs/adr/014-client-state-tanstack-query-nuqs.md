# ADR-014: Client state: TanStack Query + nuqs, no global store

- **Status:** Accepted
- **Date:** 2026-09-23
- **Related:** [`architecture.md`](../architecture.md) · [`standards.md`](../standards.md)

## Context

Most client state is server data. Some UI state should be shareable and survive a refresh (selected shot, open panel, version).

## Decision

Server state lives in TanStack Query, URL state in nuqs, form state in react-hook-form with zod contracts, and local state in `useState`/`useReducer`. There is no global store.

## Alternatives considered

- **Redux / Zustand**: A second source of truth for data that already lives in the query cache.

## Consequences

Deep-linkable UI, fewer bugs from duplicated state, and built-in caching, polling and optimistic updates.

## Revisit when

Genuinely cross-cutting client-only state emerges (for example a multi-panel editor).

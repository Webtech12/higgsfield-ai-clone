# ADR-013: Clients poll our read model with ETags

- **Status:** Accepted
- **Date:** 2026-09-23
- **Related:** [`architecture.md`](../architecture.md) · [`standards.md`](../standards.md)

## Context

Clients need live generation status. Serverless platforms make long-lived connections awkward.

## Decision

The workspace endpoint returns the project aggregate with `ETag = project.version`. The `useProject` hook polls every 2s with `If-None-Match`, receives 304 when nothing has changed, and stops automatically once all assets are finished. Polling is isolated in that one hook.

## Alternatives considered

- **WebSockets / SSE**: More moving parts on serverless, with no user-visible benefit at MVP scale.
- **Polling the provider**: Leaks orchestration into the client.

## Consequences

Simple, cheap, refresh-safe and correct. Updates arrive with up to 2s latency.

## Revisit when

Polling load becomes significant; swap the hook to push updates (Supabase Realtime, Ably or SSE).

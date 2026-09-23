# ADR-005: Provider webhooks with an inbox and a reconciliation sweep

- **Status:** Superseded by [ADR-018](./018-lean-core-for-the-24-hour-build.md)
- **Date:** 2026-09-23
- **Related:** [`architecture.md`](../architecture.md) · [`standards.md`](../standards.md)

## Context

Providers notify completion via webhooks, which can be duplicated, delayed or lost. Polling providers for every job is slow and wasteful.

## Decision

The webhook handler verifies the signature, inserts into `provider_webhook_inbox` (unique on provider + request ID), emits `provider/job.completed`, and returns 200 immediately. Workflows wait on that event with a timeout. A cron sweep every 5 minutes reconciles jobs stuck in submitted/running against the provider's status API.

## Alternatives considered

- **Polling the provider only**: Adds latency and cost, and counts against provider rate limits.
- **Processing inside the webhook request**: Slow responses cause provider retry storms and non-replayable failures.

## Consequences

Low latency, idempotent ingestion, replayability, and recovery from lost webhooks. The cost is one extra table and a cron.

## Revisit when

—

# ADR-004: Durable workflows with Inngest

- **Status:** Accepted
- **Date:** 2026-09-23
- **Related:** [`architecture.md`](../architecture.md) · [`standards.md`](../standards.md)

## Context

Video generation takes 1–3 minutes. Serverless requests time out, and browser-driven orchestration strands work when a tab closes. We need retries, timeouts, waiting for webhooks, concurrency limits per model and user, and crons.

## Decision

Use Inngest for all asynchronous orchestration: `project.plan`, `asset.generate`, `asset.sweep`, `identity.mergeGuest` and `outbox.relay`. Workflow functions are thin and delegate to use cases step by step.

## Alternatives considered

- **Holding the HTTP request open**: Exceeds serverless limits, and a refresh loses the job.
- **Browser polling of the provider**: Orchestration lives in the client; closing the tab means outputs are never persisted and credits never settled.
- **Cron sweeper only**: High latency and hand-rolled retries.
- **Raw queue (SQS/QStash) + workers**: Viable, but retries, fan-out and waiting for callbacks would all be hand-built.
- **Temporal**: Best in class at large scale, but heavy to operate for an MVP. It's the named migration target.

## Consequences

Step-level retries, `waitForEvent`, concurrency keys and run history for operations, with no infrastructure to run. This does create a dependency on a hosted vendor.

## Revisit when

Workflow volume or complexity outgrows Inngest's model or pricing; then migrate to Temporal.

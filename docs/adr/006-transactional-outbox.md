# ADR-006: Transactional outbox for events

- **Status:** Accepted
- **Date:** 2026-09-23
- **Related:** [`architecture.md`](../architecture.md) · [`standards.md`](../standards.md)

## Context

Use cases change state and must trigger workflows. Publishing an event after commit can fail, leaving assets stuck at `queued` with credits reserved.

## Decision

Write events to the `outbox` table in the same transaction as the state change. A relay publishes them to Inngest right after commit (fast path) and an Inngest cron publishes anything unpublished every minute (safety net). Consumers are idempotent.

## Alternatives considered

- **Publishing directly after commit**: Loses events on crash or network failure.
- **Publishing inside the transaction**: Couples database transactions to an external call and can publish events for rolled-back changes.

## Consequences

At-least-once delivery with no lost events. Handlers must be idempotent, which the state machine and idempotency keys already guarantee. Adds a table and a relay.

## Revisit when

—

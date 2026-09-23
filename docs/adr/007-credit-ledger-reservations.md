# ADR-007: Append-only credit ledger with reservations

- **Status:** Accepted
- **Date:** 2026-09-23
- **Related:** [`architecture.md`](../architecture.md) · [`standards.md`](../standards.md)

## Context

Credits are spent on expensive generations. Concurrent clicks, retries and failures must never cause double charges, overdrafts or lost refunds. Guest balances must move to accounts on sign-in.

## Decision

Credits are an append-only ledger: balance = `SUM(amount)`. Entries are `grant`, `reserve`, `capture` (a zero-amount audit marker), `release`, `transfer_in` and `transfer_out`, each with a unique idempotency key. Reservations happen synchronously in a transaction holding a per-user row lock (`FOR UPDATE`). Capture and release happen in the workflow.

## Alternatives considered

- **A mutable balance column**: Race-prone, no audit trail, and hard to make idempotent.

## Consequences

Race-safe, auditable, billing-ready (Stripe purchases become `grant` entries), and supports the guest merge through transfers. Balance reads need a sum or a cached projection at scale.

## Revisit when

Ledger size makes sums slow; then add a periodically snapshotted balance projection.

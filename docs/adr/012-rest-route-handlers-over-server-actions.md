# ADR-012: REST route handlers over Server Actions for mutations

- **Status:** Accepted
- **Date:** 2026-09-23
- **Related:** [`architecture.md`](../architecture.md) · [`standards.md`](../standards.md)

## Context

Mutations spend money and need idempotency keys, precise HTTP semantics (202/402/409/429) and a contract that other clients could reuse.

## Decision

All mutations go through versioned REST route handlers (`/api/v1`) with zod contracts shared in `src/contracts`, called through a typed client. Reads in Server Components call module query functions directly. Both paths call the same use cases.

## Alternatives considered

- **Server Actions**: Convenient, but they couple the contract to React and make idempotency headers and status codes awkward.
- **tRPC / GraphQL**: Extra machinery; zod contracts plus REST give the same type safety with plain HTTP.

## Consequences

One stable, framework-independent contract, ready for a mobile app or public API. Slightly more code than Server Actions.

## Revisit when

—

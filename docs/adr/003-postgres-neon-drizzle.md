# ADR-003: PostgreSQL on Neon with Drizzle ORM

- **Status:** Accepted
- **Date:** 2026-09-23
- **Related:** [`architecture.md`](../architecture.md) · [`standards.md`](../standards.md)

## Context

The data is a relational aggregate (projects → directions → shots → assets → jobs), and the credit ledger needs transactions and row locks. We want serverless-friendly hosting and cheap test databases.

## Decision

Use PostgreSQL on Neon: a pooled connection for the app, a direct one for migrations, and database branches for integration tests. Use Drizzle ORM with drizzle-kit migrations checked into the repo. Applied migrations are never edited. Invariants are mirrored as database constraints (unique, check, foreign key).

## Alternatives considered

- **Prisma**: Heavier runtime and generated client; Drizzle is SQL-first, light, and makes `FOR UPDATE` and precise SQL straightforward.
- **A document database**: A poor fit for a relational aggregate and for ledger transactions.
- **Supabase as a full platform**: Capable, but we only need Postgres; auth and storage are covered by other choices.

## Consequences

Strong consistency where money is involved, typed schemas, cheap branch-per-test databases. Drizzle is thinner than Prisma, so some query patterns are written by hand.

## Revisit when

We need read replicas or partitioning (both supported by Neon/Postgres), or ORM limitations start blocking complex queries.

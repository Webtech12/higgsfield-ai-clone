# ADR-001: Modular monolith with hexagonal modules

- **Status:** Accepted; amended by [ADR-019](./019-module-boundary-corrections.md) (processes and read queries)
- **Date:** 2026-09-23
- **Related:** [`architecture.md`](../architecture.md) · [`standards.md`](../standards.md)

## Context

One team is building one product domain in 24 hours, but the architecture must credibly scale. Generation, credits and identity have very different scaling and change profiles.

## Decision

Build a single deployable split into ten domain modules (identity, director, projects, storyboard, production, remix, routing, credits, limits, media). Each module is internally hexagonal (domain / application / ports / infrastructure) and exposes a public API only through its `index.ts`. Modules own their tables and never touch another module's tables. Asynchronous reactions go through outbox events. Boundaries are enforced by lint.

## Alternatives considered

- **Microservices from day one**: Distributed-systems cost (network failures, deployments, data consistency) with no benefit at this team size and scale.
- **Layer-first monolith (`domain/`, `application/` at the top level)**: Easy to start, but business capabilities blur together and extraction later becomes a rewrite.

## Consequences

Clear ownership and a direct extraction path (production is the first candidate). Business rules are testable in isolation. The cost is some ceremony (public APIs, interfaces) for small modules, which we accept.

## Revisit when

A module needs an independent deploy cadence or scaling profile, or a separate team owns it.

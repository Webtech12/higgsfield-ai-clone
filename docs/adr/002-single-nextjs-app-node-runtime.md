# ADR-002: A single Next.js app on the Node.js runtime

- **Status:** Accepted; amended by [ADR-021](./021-toolchain-npm-and-node-versions.md) (npm; Node 24 deployed, Node 26 locally)
- **Date:** 2026-09-23
- **Related:** [`architecture.md`](../architecture.md) · [`standards.md`](../standards.md)

## Context

The chosen stack is Next.js, Node.js and Postgres. We could run a separate Node API service (Express/Fastify/Nest) or keep the backend inside Next.js route handlers.

## Decision

Run one Next.js (App Router) application on the **Node.js runtime** (`runtime = "nodejs"`) for UI, REST API, auth, webhooks and workflow functions. Do not use the Edge runtime. Backend code lives in `src/server` behind module boundaries, independent of Next.js except for thin delivery code.

## Alternatives considered

- **A separate Node API service**: A second deploy, cross-origin setup, cookies shared across domains and duplicated tooling, costing 2–3 hours with no gain at this scale.
- **Edge runtime**: Incompatible with some Node SDKs and database drivers; nothing here benefits from edge latency.

## Consequences

One deploy, shared types and contracts, and a fast build. Long-running work never runs inside a request (see ADR-004), so serverless time limits don't bind us. Because `src/server` doesn't depend on Next.js, extracting a service later is mechanical.

## Revisit when

We need a long-lived process (for example WebSockets at scale), or the API must be deployed independently.

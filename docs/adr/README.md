# Architecture Decision Records

Each ADR records one significant decision: its context, the decision, the alternatives rejected, and the consequences. ADRs are immutable once accepted; to change a decision, add a new ADR that supersedes the old one and update the old one's status.

| ADR | Title | Status |
|---|---|---|
| [001](./001-modular-monolith.md) | Modular monolith with hexagonal modules | Accepted |
| [002](./002-single-nextjs-app-node-runtime.md) | A single Next.js app on the Node.js runtime | Accepted |
| [003](./003-postgres-neon-drizzle.md) | PostgreSQL on Neon with Drizzle ORM | Accepted |
| [004](./004-durable-workflows-inngest.md) | Durable workflows with Inngest | Accepted |
| [005](./005-webhooks-inbox-reconciliation.md) | Provider webhooks with an inbox and a reconciliation sweep | Accepted |
| [006](./006-transactional-outbox.md) | Transactional outbox for events | Accepted |
| [007](./007-credit-ledger-reservations.md) | Append-only credit ledger with reservations | Accepted |
| [008](./008-provider-ports-model-registry.md) | Provider ports, a model registry and Smart Select | Accepted |
| [009](./009-better-auth-guest-accounts.md) | Better Auth with guest (anonymous) accounts and a deferred merge | Accepted |
| [010](./010-persist-media-r2.md) | Persist generated media to Cloudflare R2 | Accepted |
| [011](./011-immutable-versioned-assets.md) | Immutable, versioned assets separate from job attempts | Accepted |
| [012](./012-rest-route-handlers-over-server-actions.md) | REST route handlers over Server Actions for mutations | Accepted |
| [013](./013-polling-read-model-etag.md) | Clients poll our read model with ETags | Accepted |
| [014](./014-client-state-tanstack-query-nuqs.md) | Client state: TanStack Query + nuqs, no global store | Accepted |
| [015](./015-paradigm-per-layer.md) | Paradigm per layer | Accepted |
| [016](./016-rate-limits-spend-kill-switch.md) | Layered rate limits, caps and a global spend kill-switch | Accepted |
| [017](./017-storyboard-frame-as-first-frame.md) | The storyboard frame is the video's first frame | Accepted |

To add a decision, copy [`000-template.md`](./000-template.md) to the next number.

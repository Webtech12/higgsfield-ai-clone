# Architecture Decision Records

Each ADR records one significant decision: its context, the decision, the alternatives rejected, and the consequences. ADRs are immutable once accepted; to change a decision, add a new ADR that supersedes the old one and update the old one's status.

| ADR | Title | Status |
|---|---|---|
| [001](./001-modular-monolith.md) | Modular monolith with hexagonal modules | Accepted; amended by 019 |
| [002](./002-single-nextjs-app-node-runtime.md) | A single Next.js app on the Node.js runtime | Accepted; amended by 021 |
| [003](./003-postgres-neon-drizzle.md) | PostgreSQL on Neon with Drizzle ORM | Accepted |
| [004](./004-durable-workflows-inngest.md) | Durable workflows with Inngest | Accepted |
| [005](./005-webhooks-inbox-reconciliation.md) | Provider webhooks with an inbox and a reconciliation sweep | Superseded by 018 |
| [006](./006-transactional-outbox.md) | Transactional outbox for events | Superseded by 018 |
| [007](./007-credit-ledger-reservations.md) | Append-only credit ledger with reservations | Accepted |
| [008](./008-provider-ports-model-registry.md) | Provider ports, a model registry and Smart Select | Accepted; amended by 020 |
| [009](./009-better-auth-guest-accounts.md) | Better Auth with guest (anonymous) accounts and a deferred merge | Accepted; amended by 019 and 022 |
| [010](./010-persist-media-r2.md) | Persist generated media to Cloudflare R2 | Superseded by 023 |
| [011](./011-immutable-versioned-assets.md) | Immutable, versioned assets separate from job attempts | Accepted; amended by 018 |
| [012](./012-rest-route-handlers-over-server-actions.md) | REST route handlers over Server Actions for mutations | Accepted |
| [013](./013-polling-read-model-etag.md) | Clients poll our read model with ETags | Accepted |
| [014](./014-client-state-tanstack-query-nuqs.md) | Client state: TanStack Query + nuqs, no global store | Accepted |
| [015](./015-paradigm-per-layer.md) | Paradigm per layer | Accepted |
| [016](./016-rate-limits-spend-kill-switch.md) | Layered rate limits, caps and a global spend kill-switch | Accepted |
| [017](./017-storyboard-frame-as-first-frame.md) | The storyboard frame is the video's first frame | Accepted |
| [018](./018-lean-core-for-the-24-hour-build.md) | Lean core for the 24-hour build | Accepted |
| [019](./019-module-boundary-corrections.md) | Module boundary corrections | Accepted |
| [020](./020-openai-llm-provider.md) | OpenAI as the LLM provider | Accepted |
| [021](./021-toolchain-npm-and-node-versions.md) | Toolchain: npm, Node 24 deployed, Node 26 locally | Accepted |
| [022](./022-no-custom-domain-yet.md) | No custom domain yet: r2.dev media and Google-only sign-in live | Accepted; media half superseded by 023 |
| [023](./023-vercel-blob-media-storage.md) | Store generated media in Vercel Blob instead of Cloudflare R2 | Accepted |
| [024](./024-ad-studio-with-consenting-talent.md) | An ad studio with seeded, consenting talent | Accepted |
| [025](./025-models-chosen-by-bake-off.md) | Models chosen by a bake-off | Accepted |

To add a decision, copy [`000-template.md`](./000-template.md) to the next number.

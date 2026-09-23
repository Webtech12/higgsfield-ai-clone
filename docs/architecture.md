# Architecture — Director (a Higgsfield AI rebuild)

> **Status:** current · **Owners:** engineering · **Related:** [`frontend.md`](./frontend.md), [`standards.md`](./standards.md), [`adr/`](./adr/README.md), [`/AGENTS.md`](../AGENTS.md)
>
> `AGENTS.md` is the operational source of truth for agents. This document explains the *why* behind it.

---

## 0. Framing: build the seams, document the scale

The system is judged on whether its architecture is **correct for the problem's real constraints**, **right-sized for today**, and **cleanly extensible for tomorrow**.

One rule follows from that: **every boundary that will matter at scale exists in the code today, but each is implemented with the simplest thing that is still correct.** Scaling means swapping an adapter or extracting a module, not rewriting the system. §14 makes that path explicit.

---

## 1. Architectural drivers

| # | Driver | Why it matters | Response |
|---|---|---|---|
| D1 | **Long-running generation** (video takes ~1–3 minutes) | Serverless requests time out; users refresh or leave | Durable workflows (Inngest); an async API that returns 202; clients read *our* state, never the provider's ([ADR-004](./adr/004-durable-workflows-inngest.md)) |
| D2 | **Unreliable external providers** | A provider outage must not become our outage | Ports + model registry; retries, timeouts, fallback models ([ADR-008](./adr/008-provider-ports-model-registry.md)) |
| D3 | **Money in motion** | Double charges, overdrafts and lost refunds destroy trust | Append-only credit ledger with reservations; idempotency everywhere ([ADR-007](./adr/007-credit-ledger-reservations.md)) |
| D4 | **Public access without a login wall** | Graders must use the app without signing in, yet anyone could drain the budget | Guest accounts via Better Auth, layered rate limits, a global spend kill-switch ([ADR-009](./adr/009-better-auth-guest-accounts.md), [ADR-016](./adr/016-rate-limits-spend-kill-switch.md)) |
| D5 | **Large binary outputs** | Provider URLs expire; video egress costs grow quickly | Persist outputs to our own object storage behind a CDN ([ADR-010](./adr/010-persist-media-r2.md)) |
| D6 | **Iterative creation** | Overwriting destroys work | Immutable, versioned assets forming a lineage tree ([ADR-011](./adr/011-immutable-versioned-assets.md)) |
| D7 | **Guest → account continuity** | Work done as a guest must survive sign-in | Deferred, idempotent guest merge via workflow ([ADR-009](./adr/009-better-auth-guest-accounts.md)) |

**The key scaling insight:** the bottleneck is **provider throughput and unit cost**, not our compute. The architecture invests in orchestration, routing and cost control, and keeps everything else simple.

---

## 2. System context and containers

```mermaid
flowchart LR
  U["Creator (browser)"] -->|"HTTPS: UI + REST v1 + auth"| APP["Next.js app on Vercel (Node runtime)<br/>UI · API · Better Auth · webhooks · workflow functions"]
  APP --> DB[("PostgreSQL (Neon)<br/>system of record")]
  APP --> RL[("Upstash Redis<br/>rate limits · idempotency")]
  APP -->|"events (outbox relay)"| WF["Inngest<br/>durable workflows"]
  WF -->|"invokes functions"| APP
  APP -->|"plan / rewrite"| LLM["Anthropic API"]
  APP -->|"submit jobs"| MP["fal.ai<br/>image + video models"]
  MP -->|"signed webhooks"| APP
  APP -->|"persist outputs"| OS[("Cloudflare R2 + CDN")]
  U -->|"stream media"| OS
  APP -->|"magic links"| EM["Resend"]
  U -->|"OAuth"| G["Google"]
  APP --> OBS["Sentry + pino logs"]
```

| Container | Responsibility | Why |
|---|---|---|
| **Next.js app** (Vercel, Node runtime) | UI, REST API, Better Auth handler, webhook ingress, workflow function host | One deployable, zero ops. Workflow code is *invoked by* Inngest, so it isn't bound by request lifetimes ([ADR-002](./adr/002-single-nextjs-app-node-runtime.md)) |
| **PostgreSQL (Neon)** | All domain data, auth tables, ledger, outbox, inbox | A relational aggregate, and the ledger needs transactions and row locks ([ADR-003](./adr/003-postgres-neon-drizzle.md)) |
| **Inngest** | Durable steps, retries, `waitForEvent`, concurrency keys, crons | Solves D1/D2 without running any infrastructure |
| **fal.ai** (behind a port) | Image and image-to-video inference | Many models behind one queue API with webhooks |
| **Anthropic** (behind a port) | Brief → structured plan; remix rewrites | Reliable structured output via tool use |
| **Cloudflare R2** | Frames and videos | Zero egress fees, which is decisive for video |
| **Upstash Redis** | Rate limiting, idempotency responses | Serverless-native |
| **Resend** | Magic-link emails | Simple and reliable |
| **Sentry + pino** | Errors, traces, structured logs | Correlation IDs on every event |

---

## 3. Architecture style: a modular monolith with hexagonal modules

**One deployable**, split into **ten domain modules** (bounded contexts). Each module is internally hexagonal: domain, application, ports and infrastructure ([ADR-001](./adr/001-modular-monolith.md)).

### 3.1 Modules

| Module | Owns | Public API (examples) | Depends on |
|---|---|---|---|
| **identity** (Auth & Accounts) | Better Auth tables; guest → account merge | `getCurrentUser`, `requireUser`, `mergeGuestAccount` | — |
| **director** (AI Director) | Director prompts, plan generation/validation, `PromptComposer` | `planProject` | projects |
| **projects** (Project & Continuity, Gallery) | projects, directions, shots, elements; workspace + gallery read models | `createProject`, `applyPlan`, `updateShot`, `updateElements`, `getWorkspaceView`, `listProjects` | identity |
| **storyboard** | Frame requests, direction selection | `generateFrames`, `selectDirection` | projects, production, routing |
| **production** (Generation Engine) | assets, generation_jobs, webhook inbox; generation workflows; stuck-job sweep | `produceDirection`, `requestGeneration`, `retryAsset` | projects, routing, credits, limits, media |
| **remix** (Remix & Versioning) | Single-shot remix → new asset version | `remixShot` | projects, production, routing, credits, limits |
| **routing** (Smart Select) | Model registry, routing policy, pricing | `selectModel`, `priceOf` | — |
| **credits** (Credits & Billing) | Append-only ledger | `grant`, `reserve`, `capture`, `release`, `transfer`, `balanceOf` | identity |
| **limits** (Usage Limits & Abuse) | Rate limits, caps, kill-switch | `assertCanGenerate`, `assertWithinRate` | identity |
| **media** (Storage & Delivery) | Object keys, persistence, delivery URLs | `persistFromUrl`, `urlFor` | — |

Cross-cutting capabilities that are **not** domain modules:
- **Provider Integration** lives in `server/integrations/*`: adapters implementing module ports.
- **Live Status** comes from the `projects` read model plus frontend polling.
- **Playback** is the frontend `features/studio`.
- **Observability** lives in `server/platform/observability`.

### 3.2 Module dependency graph (acyclic)

```mermaid
flowchart TD
  remix --> production
  remix --> projects
  storyboard --> production
  storyboard --> projects
  director --> projects
  production --> projects
  production --> credits
  production --> limits
  production --> media
  production --> routing
  remix --> routing
  remix --> credits
  remix --> limits
  storyboard --> routing
  projects --> identity
  credits --> identity
  limits --> identity
```

### 3.3 Inside a module

```
server/modules/<module>/
├─ domain/          entities, value objects, domain services, errors — pure, no I/O
├─ application/     one use-case class per file, single execute()
├─ ports/           interfaces the module needs (repositories, providers)
├─ infrastructure/  drizzle schema.ts, repositories, mappers, module-local adapters
├─ workflows/       Inngest functions owned by the module
└─ index.ts         PUBLIC API — the only import surface for other modules
```

Supporting code lives outside the modules:
- `server/integrations/`: vendor adapters (fal, anthropic, r2, upstash, resend, fake-media).
- `server/platform/`: the DB client, `UnitOfWork`, outbox relay, the Better Auth instance, HTTP wrappers, the Inngest client, env and observability.
- `server/container.ts`: the composition root.

### 3.4 Module rules

1. Import another module **only** through its `index.ts`.
2. A module never reads or writes another module's tables.
3. Synchronous cross-module writes in one transaction call public APIs with the shared `UnitOfWork`.
4. Asynchronous reactions go through **outbox events** ([ADR-006](./adr/006-transactional-outbox.md)).
5. No cycles. These rules are enforced by `eslint-plugin-boundaries` ([standards §9](./standards.md#9-enforcement)).

**Why this matters:** each module is a candidate service. `production` together with its integrations is already a coherent "Generation Service" that can be extracted when scale demands it (§14).

---

## 4. Identity and authentication

### 4.1 Model

- **Better Auth** with the Drizzle adapter, using the `anonymous` plugin (guests), Google OAuth and the `magicLink` plugin (via Resend) ([ADR-009](./adr/009-better-auth-guest-accounts.md)).
- **Everyone is a user.** Guests are `user` rows with `isAnonymous = true`. All domain data is owned by `user_id`, so there's one ownership model, one authorisation check, and no separate "guest tables."
- **No login wall.** Landing, the demo project and the gallery render without a session.
- A guest identity is created **on the first meaningful action** (submitting a brief), not on page load. This stops bots and crawlers from minting rows.

### 4.2 Guest → account linking and merge

Better Auth's anonymous plugin calls `onLinkAccount` when a guest signs in. That callback runs **after** the new session is issued and is **not atomic** with sign-in. A failure halfway through would strand the guest's work on an unreachable row. So the design keeps the callback trivial and does the real work in a durable, idempotent workflow:

```mermaid
sequenceDiagram
  participant B as Browser (guest)
  participant BA as Better Auth
  participant DB as Postgres
  participant WF as Inngest
  B->>BA: sign in (Google / magic link)
  BA->>DB: create or resolve real user, new session
  BA->>DB: onLinkAccount → INSERT outbox 'identity/guest.linked' {anonId, userId}
  BA-->>B: signed in (new session cookie)
  DB-->>WF: outbox relay publishes event
  WF->>DB: step "reassign-projects": UPDATE projects SET user_id = userId WHERE user_id = anonId
  WF->>DB: step "transfer-credits": ledger transfer anon → user (key merge:{anonId}:{userId})
  WF->>DB: step "grant-signup-bonus" (key grant:signup:{userId}, once per real user)
  WF->>DB: step "finalize": mark merge complete; delete anonymous user
  B->>B: gallery shows "Moving your guest work…" until merge completes, then refreshes
```

- `disableDeleteAnonymousUser: true` is set on the plugin; the workflow deletes the anonymous row only after a successful merge.
- Every step is idempotent (guarded updates plus unique ledger keys), so Inngest retries are safe.
- `GET /api/v1/me` exposes `pendingMerge: boolean` so the UI can show an honest transitional state.

### 4.3 Authorisation

- Route handlers and RSC resolve the user through `requireUser()` / `getCurrentUser()` (the `withUser` wrapper).
- Use cases receive `userId` as an argument and never read cookies or headers.
- Every query and command checks ownership (`WHERE user_id = $userId`). IDs coming from the client are never trusted on their own.
- The demo project is readable by anyone (`is_demo = true`) and writable by no one.

---

## 5. Data design

### 5.1 Ownership by module

| Module | Tables |
|---|---|
| identity | `user` (incl. `is_anonymous`), `session`, `account`, `verification` (Better Auth-generated), `guest_merges` |
| projects | `projects`, `directions`, `shots` |
| production | `assets`, `generation_jobs`, `provider_webhook_inbox` |
| credits | `credit_ledger` |
| limits | `usage_daily` |
| director | `llm_calls` (observability of planning/remix calls) |
| platform | `outbox` |

### 5.2 Schema (abridged)

```sql
-- projects
projects (
  id text pk, user_id text not null references "user"(id),
  title text, brief text not null,
  elements jsonb,                        -- {character, location, style}: continuity context
  intent text,                           -- smart | cinematic | draft
  status text not null,                  -- planning | planned | producing | ready | failed
  selected_direction_id text,
  is_demo boolean default false,
  version integer not null default 0,    -- bumped on any change → ETag for polling
  created_at timestamptz default now(), updated_at timestamptz default now()
);
directions ( id text pk, project_id text references projects(id), ordinal smallint, name text, tagline text, style_prompt text );
shots ( id text pk, direction_id text references directions(id), ordinal smallint, title text, description text,
        camera_motion text check (camera_motion in (/* from contracts/enums */)),
        lighting text, mood text, duration_s smallint, prompt text,
        current_frame_asset_id text, current_video_asset_id text );

-- production
assets (
  id text pk, shot_id text references shots(id), kind text check (kind in ('frame','video')),
  version integer not null, parent_asset_id text references assets(id),
  status text not null, row_version integer not null default 0,      -- optimistic locking
  storage_key text, meta jsonb, cost_credits integer not null,
  created_at timestamptz default now(),
  unique (shot_id, kind, version)
);
generation_jobs (
  id text pk, asset_id text references assets(id), attempt smallint not null,
  provider text not null, model text not null,
  provider_request_id text unique, status text not null,
  input jsonb, error jsonb, cost_usd_estimate numeric(10,4),
  submitted_at timestamptz, completed_at timestamptz
);
provider_webhook_inbox (
  id bigserial pk, provider text, provider_request_id text, payload jsonb,
  received_at timestamptz default now(), processed_at timestamptz,
  unique (provider, provider_request_id)
);

-- credits
credit_ledger (
  id bigserial pk, user_id text not null references "user"(id),
  entry_type text not null,              -- grant | reserve | release | capture | transfer_in | transfer_out
  amount integer not null,               -- signed; balance = SUM(amount)
  asset_id text, idempotency_key text unique not null,
  created_at timestamptz default now()
);

-- limits
usage_daily ( day date, scope text, scope_id text, videos integer default 0, spend_usd numeric(10,4) default 0,
              primary key (day, scope, scope_id) );          -- scope: user | global

-- platform
outbox ( id bigserial pk, event_name text not null, payload jsonb not null,
         created_at timestamptz default now(), published_at timestamptz );
```

Indexes:
- `projects(user_id, created_at desc)`
- `assets(shot_id, kind, version desc)`
- `generation_jobs(status, submitted_at)` for the stuck-job sweep
- `credit_ledger(user_id)`
- `outbox(published_at) where published_at is null`

### 5.3 Asset state machine

```mermaid
stateDiagram-v2
  [*] --> queued
  queued --> submitted: accepted by provider
  submitted --> running: provider progress
  running --> persisting: output ready
  submitted --> persisting: output ready (fast path)
  persisting --> succeeded: stored, credits captured
  submitted --> failed
  running --> failed
  persisting --> failed
  failed --> queued: user retry (new job attempt)
  succeeded --> [*]
```

Transitions come from a data table in `production/domain`. The repository saves with `WHERE id = $1 AND row_version = $2`, so duplicate webhooks and retried steps can never double-apply a transition.

---

## 6. Credits (money correctness)

Balance = `SUM(amount)` over an **append-only** ledger ([ADR-007](./adr/007-credit-ledger-reservations.md)).

| Moment | Entry | Amount | Idempotency key |
|---|---|---|---|
| Guest's first action | `grant` | + guest allowance | `grant:guest:{userId}` |
| First real sign-in | `grant` | + sign-up bonus | `grant:signup:{userId}` |
| Guest merge | `transfer_out` / `transfer_in` | ∓ guest balance | `merge:{anonId}:{userId}:out` / `:in` |
| Generation requested | `reserve` | − cost | `asset:{id}:reserve` |
| Generation succeeded | `capture` | 0 (audit marker) | `asset:{id}:capture` |
| Generation failed permanently | `release` | + cost | `asset:{id}:release` |

**Reservation is synchronous and transactional.** Within one `UnitOfWork`:
1. Lock the user's credit account (`SELECT … FOR UPDATE` on a per-user row).
2. Compute the balance.
3. Append `reserve`.
4. Create the assets.
5. Write the outbox events.

This means concurrent clicks cannot overdraw, and users get an immediate `402` rather than a delayed failure. When payments are added later, a Stripe webhook simply writes `grant` entries.

---

## 7. Generation orchestration

### 7.1 Why durable workflows

The alternatives were: holding the request open (❌ times out), browser-driven polling of the provider (❌ closing the tab strands work), a cron sweeper (⚠️ slow, hand-rolled), raw queues (⚠️ you hand-build retries and waits), and Temporal (best at large scale, heavy for an MVP). **Inngest** gives step retries, `waitForEvent`, timeouts, concurrency keys, crons and run history with zero infrastructure. Temporal is the named migration target ([ADR-004](./adr/004-durable-workflows-inngest.md)).

### 7.2 Transactional outbox

Use cases write events to `outbox` **in the same transaction** as their state changes. Publishing works in two ways:
- **Fast path:** after commit, the relay publishes and marks the rows.
- **Safety net:** an Inngest cron every minute publishes anything unpublished.

Events can therefore never be lost between commit and publish ([ADR-006](./adr/006-transactional-outbox.md)).

### 7.3 Workflows

| Workflow | Module | Trigger | Steps |
|---|---|---|---|
| `project.plan` | director | `project/created` | direct (LLM → zod, one repair retry) → `projects.applyPlan` → `storyboard.generateFrames` |
| `asset.generate` | production | `asset/generate.requested` | submit (with webhook URL) → `waitForEvent(provider/job.completed, timeout)` → on failure, retry on the fallback model → persist to R2 → finalize (state, capture/release, shot pointer, `project.version++`) |
| `asset.sweep` | production | cron (5 min) | reconcile jobs stuck in submitted/running with the provider's status API |
| `identity.mergeGuest` | identity | `identity/guest.linked` | reassign projects → transfer credits → sign-up bonus → finalize + delete anonymous user |
| `outbox.relay` | platform | cron (1 min) | publish unpublished outbox rows |

### 7.4 Production sequence

```mermaid
sequenceDiagram
  participant B as Browser
  participant API as API v1
  participant DB as Postgres
  participant WF as Inngest
  participant P as fal.ai
  participant S as R2
  B->>API: POST /v1/projects/:id/productions (Idempotency-Key)
  API->>DB: tx: lock credits, reserve, create 3 video assets, outbox events
  API-->>B: 202 Accepted
  DB-->>WF: relay publishes asset/generate.requested ×3
  WF->>P: submit job (webhook URL)
  WF-->>WF: waitForEvent provider/job.completed (match request id, timeout 10m)
  P-->>API: POST /api/webhooks/fal (signed)
  API->>DB: verify → inbox insert (unique) 
  API->>WF: emit provider/job.completed
  WF->>S: persist output
  WF->>DB: asset succeeded, capture credits, bump project.version
  loop every 2s until settled
    B->>API: GET /v1/projects/:id (If-None-Match)
    API-->>B: 304 / 200
  end
```

**Concurrency control:** `concurrency: [{ key: "model:" + model, limit: N }, { key: "user:" + userId, limit: 3 }]`. This respects provider rate limits and prevents one user from starving others.

**Webhook ingress (inbox pattern):** the handler verifies the signature, inserts into the inbox (duplicates are rejected by a unique constraint), emits an event, and returns 200 within milliseconds ([ADR-005](./adr/005-webhooks-inbox-reconciliation.md)).

---

## 8. Provider abstraction and Smart Select

```ts
interface MediaProvider {
  submit(req: GenerationRequest, opts: { webhookUrl: string }): Promise<{ requestId: ProviderRequestId }>;
  status(requestId: ProviderRequestId): Promise<ProviderStatus>;
  parseWebhook(raw: Request): Promise<ProviderCompletion>;   // verifies signature
}
interface LLMProvider {
  structured<T>(o: { system: string; input: string; schema: ZodType<T>; purpose: string }): Promise<T>;
}
```

The **model registry** (in the routing module) records each model's ID, provider, capabilities, credit cost, typical latency, quality tier and fallback order. **Smart Select** is a routing policy over the registry: given a shot's needs and the user's intent, it returns a model plus a human-readable reason for the UI. The same policy drives fallback ([ADR-008](./adr/008-provider-ports-model-registry.md)).

**Image-to-video uses the approved storyboard frame as the first frame**, so what the user approves is what they get ([ADR-017](./adr/017-storyboard-frame-as-first-frame.md)).

---

## 9. API design

REST under `/api/v1`, with contracts as zod schemas in `src/contracts` shared by client and server ([ADR-012](./adr/012-rest-route-handlers-over-server-actions.md)).

| Method | Path | Purpose | Notes |
|---|---|---|---|
| GET | `/v1/me` | User, guest flag, credits, caps, `pendingMerge` | — |
| POST | `/v1/projects` | Brief → start planning | `Idempotency-Key` · 202 |
| GET | `/v1/projects` | Gallery (+ demo) | cursor pagination |
| GET | `/v1/projects/:id` | Workspace read model | `ETag` = version → 304 |
| PATCH | `/v1/projects/:id/elements` | Edit continuity elements | `If-Match` |
| PATCH | `/v1/shots/:id` | Edit shot recipe | `If-Match` |
| POST | `/v1/projects/:id/selection` | Select a direction | 200 |
| POST | `/v1/projects/:id/productions` | Produce the selected direction | `Idempotency-Key` · 202 / 402 / 429 |
| POST | `/v1/shots/:id/remixes` | Remix one shot | `Idempotency-Key` · 202 |
| POST | `/v1/assets/:id/retries` | Retry a failed asset | 202 |
| * | `/api/auth/*` | Better Auth | — |
| POST | `/api/webhooks/fal` | Provider completion | signed, inbox |
| * | `/api/inngest` | Workflow endpoint | signed by Inngest |

- **Handler shape:** `compose(withErrorHandling, withRequestContext, withUser, withRateLimit, withIdempotency)(parse → useCase.execute → respond)`.
- **Error envelope:** `{ "error": { "code": "INSUFFICIENT_CREDITS", "message": "…", "retryable": false } }`.
- **Idempotency:** money-spending POSTs require `Idempotency-Key`. Responses are stored in Redis for 24h.
- **Live updates:** clients poll the read model with ETags. This sits behind one frontend hook, so moving to push updates is a local change ([ADR-013](./adr/013-polling-read-model-etag.md)).

---

## 10. Security and abuse prevention

| Threat | Control |
|---|---|
| Budget draining | Guest caps (tight) and user caps (looser); per-user and per-IP sliding windows (Upstash); a **global daily spend kill-switch** checked before every submit; users are routed to the demo project when caps are hit ([ADR-016](./adr/016-rate-limits-spend-kill-switch.md)) |
| Bot-minted guest accounts | Guest identity created only on the first meaningful action; per-IP rate limit on anonymous sign-in |
| Session security | Better Auth sessions (httpOnly, Secure, SameSite=Lax); trusted origins configured; CSRF protection on auth routes |
| Cross-user access | Ownership enforced in every query and command; the demo is read-only |
| Forged webhooks | Signature verification; invalid requests are rejected and logged |
| Prompt injection via brief | LLM output is schema-validated and only ever becomes data; brief length capped |
| Unsafe content | Provider safety checkers enabled; `CONTENT_REJECTED` state with credits released |
| Secrets | Vercel env only, validated at boot; `.env*` gitignored; secret scanning enabled |
| Media access | Unguessable keys `u/{userId}/p/{projectId}/s/{shotId}/{assetId}.{ext}`; signed URLs on the scale path |

---

## 11. Observability and unit economics

- Every log line and Sentry event carries `requestId`, `userId`, `projectId`, `assetId` and `jobId`.
- Inngest run history serves as the operations dashboard, with step-level failures and replay.
- Cost tracking: `generation_jobs.cost_usd_estimate` plus `llm_calls` token counts give **cost per project** and **cost per successful video**.
- **Key metrics:**
  - Time to first frame.
  - Video success rate by model.
  - p50/p95 latency by model.
  - Fallback rate.
  - Credits reserved vs captured.
  - Guest → account conversion.

---

## 12. Testing strategy (summary)

The test pyramid is aligned with the architecture:
- Domain unit tests.
- Use-case tests with in-memory fakes.
- Shared **contract suites** for every adapter and repository.
- Integration tests against a real Postgres (Neon branch), covering concurrent credit reservations, the outbox relay and guest-merge idempotency.
- One Playwright journey using the fake media provider.

Details are in [`standards.md` §8](./standards.md#8-testing-strategy).

---

## 13. Built now vs designed for later

| Capability | Built now | Designed / documented |
|---|---|---|
| Modular monolith, hexagonal modules, boundary lint | ✅ | Service extraction |
| Better Auth: guests, Google, magic link, deferred merge | ✅ | Organisations/teams, passkeys |
| Durable workflows, retries, fallback, concurrency keys | ✅ | Temporal migration |
| Outbox + inbox + reconciliation sweep | ✅ | — |
| Credit ledger with reservations and transfers | ✅ | Stripe purchases → `grant` |
| R2 persistence | ✅ | Signed URLs, multi-region |
| Caps, rate limits, kill-switch | ✅ | Tiered quotas per plan |
| Polling with ETag | ✅ | Push updates |
| Registry + Smart Select | ✅ basic | Health- and cost-aware routing |
| Tests: domain, use case, contract, integration, e2e | ✅ | Load tests |

---

## 14. Scaling path

| Stage | Load | Changes | Trigger |
|---|---|---|---|
| **1 · MVP** | Hundreds of users; tens of concurrent jobs | As built | — |
| **2 · Growth** | ~100k users; thousands of concurrent jobs | Stripe purchases write ledger grants · plan tiers with separate concurrency lanes · push updates replace polling · Neon read replica for read models · Redis cache for hot workspaces · multiple provider accounts | Provider throttling, polling load, paying users |
| **3 · Scale** | Millions of users | Extract the **production** module (+ integrations) as a Generation Service with its own schema · migrate orchestration to Temporal if needed · self-hosted GPU inference for high-volume models (the largest cost lever) · time-partitioned `assets`/`generation_jobs` · analytics warehouse · multi-region storage | Unit economics, vendor risk, team topology |

The module boundaries make stage 3 an **extraction, not a rewrite**.

---

## 15. Decisions

All significant decisions are recorded as ADRs in [`docs/adr/`](./adr/README.md).

# AGENTS.md — Director (a Higgsfield AI rebuild)

This file is the single source of truth for any coding agent working in this repo.
Deeper rationale lives in `docs/architecture.md`, `docs/frontend.md`, `docs/standards.md` and `docs/adr/`.
If anything here conflicts with those docs, THIS FILE WINS. Flag the conflict so the docs can be fixed.

---

## 1. Product

An AI creative director for video. The user writes a rough idea (a brief). The app returns 3 creative
directions, each with 3 shots and a storyboard frame per shot. The user picks a direction, each shot
becomes a video (image-to-video, with the storyboard frame as the first frame), and the user can remix
ONE shot without regenerating the others. Every version is kept.

It uses Higgsfield's cinematic language (camera-motion presets such as dolly in, crane up, crash zoom,
FPV) but reorganises the experience around the creator's intent instead of model selection.

**Core loop:** Brief → Directions/Storyboard → Produce → Review → Remix one shot → Playback.

**Out of scope (do NOT build):** model marketplace, Cinema Studio clone, node/canvas workflows,
Soul ID training, marketing studio, real payments, collaboration, a video editor, stitched MP4 export.

---

## 2. Tech stack (fixed — do not add alternatives without an ADR)

| Concern | Choice |
|---|---|
| Runtime | Node.js 24 LTS. All route handlers use the Node runtime (`export const runtime = "nodejs"`), never Edge |
| Framework | Next.js (App Router) + TypeScript (strict) + React Server Components |
| Package manager | pnpm |
| Database | PostgreSQL on Neon (pooled connection for the app, direct connection for migrations) |
| ORM / migrations | Drizzle ORM + drizzle-kit (SQL-first; migrations checked in, never edited after being applied) |
| Auth | Better Auth + Drizzle adapter: `anonymous` plugin (guests), Google OAuth, `magicLink` plugin |
| Transactional email | Resend (magic-link emails) |
| Durable workflows | Inngest |
| LLM | Anthropic API (`@anthropic-ai/sdk`), structured output via tool use + zod |
| Image / video models | fal.ai (`@fal-ai/client`) queue API + webhooks |
| Object storage | Cloudflare R2 via the S3 SDK (`@aws-sdk/client-s3`) |
| Rate limits / idempotency store | Upstash Redis (`@upstash/ratelimit`, `@upstash/redis`) |
| Validation | zod (shared client/server via `src/contracts`) |
| UI | Tailwind CSS, shadcn/ui (Radix), `class-variance-authority`, `motion` |
| Client data | TanStack Query (server state), `nuqs` (URL state), react-hook-form + zod (forms) |
| Testing | Vitest, React Testing Library, MSW, Playwright |
| Observability | Sentry + pino structured logs |
| Tooling | ESLint (typescript-eslint strict, eslint-plugin-boundaries, jsx-a11y), Prettier, husky, lint-staged, GitHub Actions |
| Hosting | Vercel (app), Neon (DB), Inngest Cloud, Cloudflare R2, Upstash |

Rejected on purpose: a separate Express/Nest API service, Prisma, tRPC/GraphQL, Redux/Zustand,
hosted auth (Clerk), Edge runtime, ffmpeg. The reasons are in `docs/adr/`.

---

## 3. Modules (bounded contexts)

The backend is a **modular monolith**. Each module owns its tables and exposes a public API from
`src/server/modules/<module>/index.ts`. Frontend features map onto the same modules.

| Module | Owns | Public API (examples) | May depend on |
|---|---|---|---|
| **identity** (Auth & Accounts) | Better Auth tables (user, session, account, verification); guest → account merge | `getCurrentUser`, `requireUser`, `mergeGuestAccount` | — |
| **director** (AI Director) | Director prompts, plan generation and validation | `planProject` | projects |
| **projects** (Project & Continuity, Gallery) | projects, directions, shots, elements; workspace + gallery read models | `createProject`, `applyPlan`, `updateShot`, `updateElements`, `getWorkspaceView`, `listProjects` | identity |
| **storyboard** | Frame generation requests, direction selection | `generateFrames`, `selectDirection` | projects, production, routing |
| **production** (Generation Engine) | assets, generation_jobs, provider webhook inbox; generation workflows + stuck-job sweep | `produceDirection`, `requestGeneration`, `retryAsset` | projects, routing, credits, limits, media |
| **remix** (Remix & Versioning) | Shot remix (LLM rewrite → new asset version with `parent_asset_id`) | `remixShot` | projects, production, routing, credits, limits |
| **routing** (Model Routing / Smart Select) | Model registry, routing policy, pricing | `selectModel`, `priceOf` | — |
| **credits** (Credits & Billing) | Append-only credit ledger | `grant`, `reserve`, `capture`, `release`, `transfer`, `balanceOf` | identity |
| **limits** (Usage Limits & Abuse Protection) | Rate limits, guest/user caps, global spend kill-switch | `assertCanGenerate`, `assertWithinRate` | identity |
| **media** (Media Storage & Delivery) | Object keys, persistence from provider URLs, delivery URLs | `persistFromUrl`, `urlFor` | — |

Cross-cutting capabilities that are not domain modules:
- **Provider Integration** → `src/server/integrations/*` (fal, anthropic, r2, upstash, resend). These are adapters implementing module ports.
- **Live Status & Updates** → the `projects` read model + the frontend `useProject` polling hook.
- **Playback** → frontend `features/studio` (sequential player + downloads).
- **Observability** → `src/server/platform/observability`.

**Module rules**
- Import another module ONLY via its `index.ts`. Never import another module's `domain/`, `infrastructure/` or tables.
- A module never queries or writes another module's tables.
- Writes that span modules in one transaction (e.g. reserve credits + create assets + outbox event) call each module's public API with the shared `UnitOfWork` from `platform/db`.
- Asynchronous reactions go through events written to the **transactional outbox** and are published to Inngest by the relay.
- No dependency cycles. If two modules need each other, the shared concept belongs in one of them or in `contracts/`.

---

## 4. Repository layout

```
src/
├─ app/                                  # delivery only: routes, layouts, route handlers
│  ├─ page.tsx                           # Brief
│  ├─ p/[projectId]/{page,loading,error}.tsx   # Board / Studio
│  ├─ projects/page.tsx                  # Gallery
│  ├─ sign-in/page.tsx
│  └─ api/
│     ├─ auth/[...all]/route.ts          # Better Auth handler
│     ├─ v1/…                            # REST API
│     ├─ webhooks/fal/route.ts           # verify → inbox → event
│     └─ inngest/route.ts                # workflow endpoint
├─ features/                             # frontend slices: auth, brief, board, studio, projects, credits
├─ entities/project/                     # shared frontend slice: queries, useProject, view models, status meta
├─ shared/                               # ui (design system), lib (apiClient, apiErrors, idempotency), config
├─ contracts/                            # zod schemas + enums shared by client and server
└─ server/
   ├─ modules/<module>/
   │  ├─ domain/                         # entities, value objects, domain services, errors — pure, no I/O
   │  ├─ application/                    # one use-case class per file, single execute()
   │  ├─ ports/                          # interfaces this module needs
   │  ├─ infrastructure/                 # drizzle schema.ts, repositories, mappers, module-local adapters
   │  ├─ workflows/                      # Inngest functions owned by this module (if any)
   │  └─ index.ts                        # PUBLIC API — the only import surface
   ├─ integrations/                      # vendor adapters: fal/, anthropic/, r2/, upstash/, resend/, fake-media/
   ├─ platform/                          # db client + UnitOfWork + outbox relay, auth instance, http wrappers,
   │                                     # inngest client, env (zod), observability
   └─ container.ts                       # composition root — the ONLY place concrete classes are constructed
tests/
├─ contracts/                            # shared suites every adapter/repository implementation must pass
├─ integration/                          # real Postgres (Neon branch)
└─ e2e/                                  # Playwright, MEDIA_PROVIDER=fake
docs/  architecture.md  frontend.md  standards.md  adr/  research/
.agent-logs/                             # agent capture — commit with every commit
```

---

## 5. Auth & accounts (identity module)

- **No login wall.** The app, the demo project and the gallery open without signing in.
- A guest identity is created with Better Auth's `anonymous` plugin **on the first meaningful action**
  (submitting a brief), not on page load. This avoids bot-created rows.
- **All data is owned by `user_id`.** Guests are users with `isAnonymous = true`. There are no separate "session-owned" tables.
- Sign-in methods: Google OAuth and magic link (Resend). Sign-in is offered in the profile menu, when a guest hits a cap, and before exporting.
- **Guest → account merge:** the anonymous plugin's `onLinkAccount` runs AFTER the new session is issued and is
  NOT atomic with sign-in. Therefore:
  - `onLinkAccount` only writes a `identity/guest.linked { anonymousUserId, newUserId }` event to the outbox.
  - The `identity.mergeGuest` workflow reassigns projects and transfers credits via the ledger (`transfer` entries).
    It is idempotent (key `merge:{anon}:{new}`) and retried by Inngest.
  - Set `disableDeleteAnonymousUser: true`. The merged anonymous row is cleaned up by the workflow after a successful merge.
- The sign-up bonus is granted once per real user (idempotency key `grant:signup:{userId}`).
- Authorisation: every query and use case checks ownership (`project.userId === currentUser.id`). Never trust IDs from the client alone.
- `requireUser()` is for route handlers and RSC; use cases receive `userId` as an argument and never read cookies.

---

## 6. Architecture rules (backend)

- **Paradigm per layer:**
  - `domain/` uses a rich OOP domain model. Entities/aggregates (`Project`, `Asset`, `CreditAccount`) keep state private and change only via intention-revealing methods. Value objects (`Credits`, `ShotDuration`, branded IDs) are immutable and validate on creation. Domain services are stateless and pure.
  - `application/` has one use-case class per file, constructor-injected ports, and a single `execute()`.
  - `infrastructure/` and `integrations/` are classes implementing ports. Cross-cutting behaviour is added with decorators.
- Inheritance ONLY for the `DomainError` hierarchy. Composition everywhere else. No `BaseRepository<T>` or `BaseService`.
- Vendor SDKs (`@fal-ai/*`, `@anthropic-ai/*`, `@aws-sdk/*`, `@upstash/*`, `resend`) are imported ONLY in `server/integrations/**`.
  `drizzle-orm` is imported ONLY in `infrastructure/` and `platform/db`.
- `server/container.ts` is the only place concrete classes are constructed. Use cases and domain code NEVER import it.
- Route handlers and workflow functions: compose wrappers (`withErrorHandling`, `withRequestContext`, `withUser`,
  `withRateLimit`, `withIdempotency`) → parse with zod → call a use case → map the response. No business logic.
- **Async generation:** never wait for a provider inside a request. Submit via the workflow, return **202**, and let the client poll the read model.
- **Asset lifecycle** is a table-driven state machine (`queued → submitted → running → persisting → succeeded | failed`, `failed → queued` on retry). Repositories save with optimistic locking (`WHERE id = $1 AND row_version = $2`).
- **Webhooks:** verify the signature → insert into the inbox (unique `provider, provider_request_id`) → emit an event → return 200. Process nothing inline.
- **Money path:** in one `UnitOfWork` transaction, lock the credit account row (`FOR UPDATE`), append the ledger entry with an idempotency key, create the assets, and write the outbox event. Capture on success, release on final failure.
- Resilience: retries, timeouts and fallback order come from `platform/config/resilience.ts` and the model registry. Never hard-code them.
- Reads: RSC and GET routes use `*Queries` (flat DTOs, optimised SQL). Writes use repositories + aggregates (CQS).

## 7. Architecture rules (frontend)

- Server Components by default. `"use client"` only for interactive islands.
- Layers: `app → features → entities → shared → contracts`. Features never import each other. Import slices only via `index.ts`.
- Reads in RSC call the module query functions directly; mutations go through `/api/v1` via `shared/lib/apiClient`.
- State homes: server state = TanStack Query; URL state = nuqs; forms = react-hook-form + zod contracts; everything else = `useState`/`useReducer`. No global stores.
- `useProject()` polls every 2s with `If-None-Match` and stops automatically when all assets are terminal.
- Money-spending mutations: the CALLER creates the `Idempotency-Key` once per user action and passes it in.
- Components receive view models, never raw DTOs. Status/variant/error handling uses exhaustive `satisfies Record<…>` maps.
- Every async region has designed loading, empty, error and success states. Status changes are announced through an `aria-live` region.
- Design system components come from `shared/ui` only. Never import Radix directly in features.
- Functional composition only. No class components and no inheritance. The only frontend class is `ApiError`.

## 8. Code standards (whole app)

- TypeScript `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. No `any`, no floating promises, no swallowed errors, no unexplained `!`.
- Parse with zod at every trust boundary: HTTP bodies, webhooks, LLM output, env, API responses on the client.
- **DRY = one home per piece of knowledge:**
  - Shapes and enums live in `contracts/`.
  - Models, capabilities and costs live in the routing module's registry.
  - Prompts are built only by `director`'s `PromptComposer`.
  - Error code → HTTP status lives in `platform/http/errorMap.ts`; error code → user copy lives in `shared/lib/apiErrors.ts`.
  - Do not abstract before the third use (rule of three).
- **SOLID:**
  - Extend via registry entries, strategies, decorators and map entries, not new `if/else` branches.
  - Keep ports narrow.
  - Every adapter or repository implementation passes its suite in `tests/contracts`.
- Naming:
  - Use cases are verbs (`ProduceDirection`), ports are nouns (`MediaProvider`), and adapters are vendor-prefixed (`FalMediaProvider`).
  - Booleans read as questions (`isSettled`).
- Size signals: split functions over ~50 lines, components over ~150 lines, and files over ~250 lines.
- Comments explain WHY. Link the ADR for any architectural choice.

## 9. Testing

- Domain: unit tests for every entity, value object, policy and state transition (target ~90% coverage on `domain/`).
- Use cases: in-memory repositories + `FakeMediaProvider` + a fake clock.
- Contracts: every `MediaProvider`, `LLMProvider`, `ObjectStorage` and repository implementation runs the shared suite.
- Integration: credit reservation under concurrency (two parallel reserves must not overdraw), outbox relay, guest merge idempotency.
- Frontend: view models, `useProject` polling stop, optimistic remix + rollback, error-state mapping (RTL + MSW).
- E2E (Playwright, fake provider): brief → board → produce → remix one shot → playback, then sign-in with guest work preserved.

## 10. Commands

```bash
pnpm dev                # Next.js dev server
pnpm inngest:dev        # Inngest dev server (run alongside pnpm dev)
pnpm lint               # eslint (includes boundary rules)
pnpm typecheck          # tsc --noEmit
pnpm test               # vitest (unit + use case + contract)
pnpm test:integration   # vitest against a Neon test branch
pnpm test:e2e           # playwright, MEDIA_PROVIDER=fake
pnpm db:generate        # drizzle-kit generate (new migration from schema changes)
pnpm db:migrate         # apply migrations
pnpm db:seed            # seed the demo project
pnpm auth:generate      # regenerate Better Auth schema
```

## 11. Environment

All variables are validated by `src/server/platform/env.ts` at boot. Never read `process.env` elsewhere.

```
DATABASE_URL, DATABASE_URL_UNPOOLED
BETTER_AUTH_SECRET, BETTER_AUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, RESEND_API_KEY, EMAIL_FROM
ANTHROPIC_API_KEY, DIRECTOR_MODEL
FAL_KEY, FAL_WEBHOOK_SECRET, MEDIA_PROVIDER (fal | fake)
INNGEST_EVENT_KEY, INNGEST_SIGNING_KEY
R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL
UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
GUEST_VIDEO_CAP, USER_VIDEO_CAP, DAILY_SPEND_CAP_USD
SENTRY_DSN, NEXT_PUBLIC_APP_URL
```

Only `NEXT_PUBLIC_*` variables may reach the client. Never commit `.env*` files.

## 12. Working process for agents

1. Read this file first. For module work, also read that module's `index.ts` and the relevant section of `docs/architecture.md`.
2. **For any task touching more than 2 files:** propose a plan (files, responsibilities, tests) and WAIT for approval.
3. Build inside-out: contracts → domain (+ tests) → ports → application (+ tests with fakes) → infrastructure/integrations (+ contract tests) → delivery → UI.
4. Use `MEDIA_PROVIDER=fake` for all UI work. Real providers only at integration checkpoints.
5. Before declaring done: `pnpm lint && pnpm typecheck && pnpm test` must pass.
6. Use Conventional Commits (`feat(production): …`, `fix(credits): …`, `docs(adr): …`).
   Commit `.agent-logs/` together with the code, in every commit.
7. Never edit an applied migration. Never weaken a lint rule, type setting or test to make something pass. Raise it instead.
8. If a requested change conflicts with these rules, say so and propose an alternative rather than silently deviating.

## 13. Definition of Done

- [ ] Module boundaries respected (the boundary lint passes)
- [ ] Contracts updated; no ad-hoc types
- [ ] Domain logic in `domain/`, with tests; use case tested with fakes
- [ ] Adapter/repository changes pass the contract suites
- [ ] Ownership check on every read and write
- [ ] Money paths are transactional + idempotent, with an integration test
- [ ] Loading / empty / error / success states designed; keyboard + screen-reader friendly
- [ ] Works on mobile width and in an incognito window (guest flow)
- [ ] Lint, typecheck and tests green; Conventional Commit; `.agent-logs/` committed

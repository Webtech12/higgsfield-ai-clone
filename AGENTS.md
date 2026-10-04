# AGENTS.md — Director (a Higgsfield AI rebuild)

This file is the single source of truth for any coding agent working in this repo.
Deeper rationale lives in `docs/architecture.md`, `docs/frontend.md`, `docs/standards.md` and `docs/adr/`.
If anything here conflicts with those docs, THIS FILE WINS. Flag the conflict so the docs can be fixed.
The assignment brief is in `docs/assignment.md`, the Higgsfield teardown in `docs/research/`, and the
build order and cut list in `docs/plan.md`.

---

## 1. Product

An AI creative director for **ads** ([ADR-024](docs/adr/024-ad-studio-with-consenting-talent.md)).
A brand describes its product and the ad it wants in a structured brief with product photos, and casts
one talent from a roster of real people who have consented. The app returns 3 ad concepts, each with
3 shots and a storyboard frame per shot showing the talent and the product. The brand picks a concept,
Director finishes it as one ad (a premium video per shot, a music bed and on-screen text, joined into
one MP4), and the brand refines it and downloads it. Every version is kept.

It uses Higgsfield's cinematic language (camera-motion presets such as dolly in, crane up, crash zoom,
FPV) but organises the experience around the brand's intent instead of model selection.

**Core loop:** Brief → 3 concepts (storyboards) → Finish → Review → Refine → Download.

**Product decisions**
- **Brief:** a template (UGC testimonial, product hero, lifestyle, unboxing, before/after), product name
  and key benefit, audience, key message, call to action, mood chips, scene direction, up to 3 product
  photos and 2 scene photos, one talent (optional only for product hero), and an aspect ratio (9:16, 16:9
  or 1:1). **Polish with AI** rewrites the fields, flags what's missing and gives tips. There is no model
  picker; Smart Select chooses models.
- **Talent:** 5 seeded profiles of real people with a signed release. We store its date, scope and a
  reference; the document stays offline. No talent sign-up or login yet. Talent photos and the manifest
  never enter git: a seed script uploads them from a local, gitignored `talent/` folder. A deactivated
  talent can't be cast, and no new generation uses their photos.
- **Board:** each concept shows its hook, headline, call to action, music mood and 3 shots with
  storyboard frames drawn from the talent's and product's photos. After picking a concept, the brand can
  edit a shot's description, camera move and duration; an edited shot shows "Frame out of date" with a
  free, rate-limited **Redraw frame** action.
- **Finish:** each shot becomes a premium video from its current frame (the frame is the first frame),
  plus a music bed and the headline and call to action as text, assembled into one MP4 by fal's cloud
  ffmpeg. Each shot is also downloadable.
- **Refine:** re-direct one shot, swap the talent, change the music or edit the text. Each refinement
  makes a new version of the finished ad (`parent_asset_id`); the latest success is current and older
  versions stay playable.
- **Credits:** finishing an ad costs 30 credits and a refinement 10, charged on the finished ad and
  refunded if it fails. Briefs, Polish with AI, planning and storyboard frames are free but rate-limited,
  and frames count toward the daily spend cap. Guests start with 40 credits (exactly 1 ad + 1
  refinement); signing in adds 60. The balance sits in the header, and every button that spends credits
  shows its cost.
- **Caps:** 6 videos per guest, 18 per user, and a $10/day global spend kill-switch.
- **Examples:** finished ads are shown with the briefs that made them, public and read-only. A
  signed-out visitor can watch them straight away.

**Out of scope (do NOT build):** model marketplace, Cinema Studio clone, node/canvas workflows,
per-talent model training (Soul ID), talent sign-up or logins, brand video uploads,
voiceover/dialogue/lip-sync, a chat agent, real payments, collaboration, a timeline video editor.

---

## 2. Tech stack (fixed — do not add alternatives without an ADR)

| Concern | Choice |
|---|---|
| Runtime | Node.js 24 on Vercel and in CI (`engines: 24.x`). Local development may run Node 26, so don't use APIs newer than Node 24 ([ADR-021](docs/adr/021-toolchain-npm-and-node-versions.md)). All route handlers use the Node runtime (`export const runtime = "nodejs"`), never Edge |
| Framework | Next.js 16 (App Router) + TypeScript (strict) + React Server Components. Middleware is `proxy.ts`; lint with the ESLint CLI (`next lint` no longer exists) |
| Package manager | npm ([ADR-021](docs/adr/021-toolchain-npm-and-node-versions.md)) |
| Database | PostgreSQL on Neon via node-postgres (`pg`): pooled URL for the app, direct URL for migrations. The money path needs interactive transactions with `SELECT … FOR UPDATE`, which the Neon HTTP driver can't run |
| ORM / migrations | Drizzle ORM + drizzle-kit (SQL-first; migrations checked in, never edited after being applied) |
| Auth | Better Auth + Drizzle adapter: `anonymous` plugin (guests), Google OAuth, `magicLink` plugin. Magic link is hidden on the live app until a domain is verified ([ADR-022](docs/adr/022-no-custom-domain-yet.md)) |
| Transactional email | Resend for magic links once a domain exists; a fake sender that logs the link in dev, CI and E2E |
| Durable workflows | Inngest. Generation workflows poll the provider's status; there are no webhooks in v1 ([ADR-018](docs/adr/018-lean-core-for-the-24-hour-build.md)) |
| LLM | OpenAI Responses API (`openai`), structured outputs validated with zod, `DIRECTOR_MODEL=gpt-6-sol` ([ADR-020](docs/adr/020-openai-llm-provider.md)) |
| Image / video / music models | fal.ai (`@fal-ai/client`) queue API, polled from the workflow. Model IDs come from the bake-off and live in the routing registry. fal's cloud ffmpeg assembles finished ads ([ADR-024](docs/adr/024-ad-studio-with-consenting-talent.md)) |
| Object storage | Vercel Blob (`@vercel/blob`), public, served from Vercel's CDN ([ADR-023](docs/adr/023-vercel-blob-media-storage.md)) |
| Rate limits / idempotency store | Upstash Redis (`@upstash/ratelimit`, `@upstash/redis`) |
| Validation | zod (shared client/server via `src/contracts`) |
| UI | Tailwind CSS, shadcn/ui (Radix), `class-variance-authority`, `motion` |
| Client data | TanStack Query (server state), `nuqs` (URL state), react-hook-form + zod (forms) |
| Testing | Vitest, React Testing Library, MSW, Playwright |
| Observability | pino structured logs. Sentry is deferred ([ADR-018](docs/adr/018-lean-core-for-the-24-hour-build.md)) |
| Tooling | ESLint (typescript-eslint strict, eslint-plugin-boundaries, jsx-a11y), Prettier, husky, lint-staged, GitHub Actions. Formatters and linters never touch `.claude/` |
| Hosting | Vercel (app and Blob), Neon (DB), Inngest Cloud, Upstash |

Rejected on purpose: a separate Express/Nest API service, Prisma, tRPC/GraphQL, Redux/Zustand,
hosted auth (Clerk), Edge runtime, ffmpeg inside our own functions. The reasons are in `docs/adr/`.

---

## 3. Modules (bounded contexts)

The backend is a **modular monolith**. Each module owns its tables and exposes a public API from
`src/server/modules/<module>/index.ts`. Frontend features map onto the same modules.

| Module | Owns | Public API (examples) | May depend on |
|---|---|---|---|
| **identity** (Auth & Accounts) | Better Auth tables (user, session, account, verification) and `guest_merges` | `getCurrentUser`, `requireUser`, `markGuestMerged` | — |
| **director** (AI Director) | Director prompts and the `PromptComposer`, ad plans and their validation, the brief coach, refinement rewrites | `planProject`, `coachBrief`, `composeFramePrompt`, `composeVideoPrompt`, `rewriteShot` | projects, talent |
| **projects** (Project & Continuity) | projects (with the ad brief, cast and photo references), directions (concepts), shots, elements | `createProject`, `applyPlan`, `selectDirection`, `updateShot`, `updateElements`, `reassignOwner` | identity |
| **talent** (Talent roster) | `talents`: profiles, photos, consent record, active flag | `getCasting` | — |
| **storyboard** | Frame generation and redraws, with talent and product photos as references | `generateFrames`, `redrawFrame` | projects, production, routing, director, talent |
| **production** (Generation Engine) | assets, generation_jobs; generation workflows + stuck-job sweep; finishing an ad | `produceDirection`, `requestGeneration`, `retryAsset` | projects, routing, credits, limits, media, director |
| **remix** (Refine & Versioning) | Refinements of a finished ad (re-direct a shot, swap the talent, change the music, edit the text) → a new version with `parent_asset_id` | `refineAd` | projects, production, routing, credits, limits, director, talent |
| **routing** (Model Routing / Smart Select) | Model registry, routing policy, pricing | `selectModel`, `priceOf` | — |
| **credits** (Credits & Billing) | Append-only credit ledger | `grant`, `reserve`, `capture`, `release`, `transfer`, `balanceOf` | identity |
| **limits** (Usage Limits & Abuse Protection) | Rate limits, guest/user caps, global spend kill-switch | `assertCanGenerate`, `assertWithinRate`, `recordUsage` | identity |
| **media** (Media Storage & Delivery) | Object keys, brand photo `uploads`, persistence from provider URLs, delivery URLs | `persistFromUrl`, `saveUpload`, `getOwnedUploads` | — |

Cross-cutting code that is not a domain module ([ADR-019](docs/adr/019-module-boundary-corrections.md)):
- **Processes** → `src/server/processes/*`: workflows that coordinate several modules through their public APIs (`mergeGuest`, `onboarding`, `createAd`). A process may depend on any module; no module depends on a process.
- **Read queries** → `src/server/queries/*`: read-only SQL for the workspace view (`getWorkspaceView`) and the gallery (`listProjects`). The only code that may read across module tables. It never writes.
- **Provider Integration** → `src/server/integrations/*` (fal, openai, blob, upstash, resend, and a fake for each port). These are adapters implementing module ports.
- **Live Status & Updates** → the workspace read query + the frontend `useProject` polling hook.
- **Playback** → frontend `features/studio` (sequential player + downloads).
- **Observability** → `src/server/platform/observability`.

**Module rules**
- Import another module ONLY via its `index.ts`. Never import another module's `domain/`, `infrastructure/` or tables.
- A module never queries or writes another module's tables. Only `server/queries/` reads across tables.
- Writes that span modules in one transaction (e.g. reserve credits + record usage + create assets) call each module's public API with the shared `UnitOfWork` from `platform/db`.
- **Asynchronous reactions** ([ADR-018](docs/adr/018-lean-core-for-the-24-hour-build.md)): inside Inngest functions, chain with `step.sendEvent`, which is durable. From request handlers, send the event after the transaction commits. The entity's own status (an asset still `queued`, a merge still `pending`) is the durable record, and a one-minute sweep re-sends anything stuck. There is no outbox table.
- No dependency cycles. If two modules need each other, the shared concept belongs in one of them, in a process, or in `contracts/`.

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
│     └─ inngest/route.ts                # workflow endpoint
├─ features/                             # frontend slices: auth, brief, board, studio, projects, credits
├─ entities/                             # shared frontend slices: project (queries, useProject, view
│                                        # models, status meta), talent (view models, talent card)
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
   ├─ processes/                         # cross-module workflows (guest merge, onboarding grants)
   ├─ queries/                           # read-only cross-module read models (workspace, gallery)
   ├─ integrations/                      # vendor adapters: fal/, openai/, blob/, upstash/, resend/, fake/
   ├─ platform/                          # db client + UnitOfWork, http wrappers, inngest client,
   │                                     # env (zod), observability
   └─ container.ts                       # composition root — the ONLY place concrete classes are constructed
tests/
├─ contracts/                            # shared suites for MediaProvider and LLMProvider implementations
├─ integration/                          # real Postgres (Neon test branch)
└─ e2e/                                  # Playwright, PROVIDERS=fake
scripts/                                 # ops tooling: migrations preflight, demo, talent seed, bake-off
fixtures/talent/                         # fictional placeholder talent for development and E2E
talent/                                  # the real talent pack (manifest + photos): gitignored, never committed
docs/  assignment.md  plan.md  architecture.md  frontend.md  standards.md  adr/  research/
```

The Better Auth instance and its generated schema live in `server/modules/identity/infrastructure/`.
Scripts are tooling outside the app, so they may call `pg`, `@vercel/blob` or `@fal-ai/client` directly.

---

## 5. Auth & accounts (identity module)

- **No login wall.** The app, the demo project and the gallery open without signing in.
- A guest identity is created with Better Auth's `anonymous` plugin **on the first meaningful action**
  (uploading a photo, polishing a brief or submitting one), not on page load. This avoids bot-created rows.
- **All data is owned by `user_id`.** Guests are users with `isAnonymous = true`. There are no separate "session-owned" tables.
- Sign-in methods: Google OAuth and magic link. The live app shows only Google until a domain is verified
  ([ADR-022](docs/adr/022-no-custom-domain-yet.md)); magic link with the fake email sender is what the E2E tests use.
  Sign-in is offered in the profile menu, when a guest hits a cap, and before downloading a video.
- **Starter credits:** the `onboarding` process grants 40 credits to a guest (`grant:guest:{userId}`) and 60
  once per real user (`grant:signup:{userId}`). It is called idempotently from `GET /api/v1/me` and before
  any credit reservation, so a missed call can never lose a grant.
- **Guest → account merge** ([ADR-019](docs/adr/019-module-boundary-corrections.md)): the anonymous plugin's
  `onLinkAccount` runs AFTER the new session is issued and is NOT atomic with sign-in. Therefore:
  - `onLinkAccount` only inserts a `pending` row in `guest_merges` (keyed by the anonymous user id) and sends
    `identity/guest.linked { anonymousUserId, newUserId }`. It does nothing else.
  - The `mergeGuest` process reassigns projects (`projects.reassignOwner`), transfers the guest's credit balance
    (`credits.transfer`, keys `merge:{anon}:{new}:out` / `:in`), then marks the merge done
    (`identity.markGuestMerged`). Every step is idempotent and retried by Inngest; the sweep re-sends pending merges.
  - Set `disableDeleteAnonymousUser: true`. The anonymous user is **never deleted**: its append-only ledger rows
    reference it. It stays marked as merged.
  - `GET /api/v1/me` returns `pendingMerge`, so the UI can say "Moving your guest work…" until the merge is done.
  - A magic link opened in a different browser carries no guest cookie, so nothing is merged. The sign-in
    dialog tells guests to open the link in the same browser.
- Authorisation: every query and use case checks ownership (`project.userId === currentUser.id`). Never trust IDs from the client alone.
  The demo project (`is_demo = true`) is the one exception: readable by anyone, writable by no one.
- `requireUser()` is for route handlers and RSC; use cases receive `userId` as an argument and never read cookies.

---

## 6. Architecture rules (backend)

- **Paradigm per layer:**
  - `domain/` uses a rich OOP model where invariants matter: `CreditAccount` (no overdraft), `Asset` (the lifecycle state machine) and `Project` (one selected direction) keep state private and change only via intention-revealing methods. Elsewhere, prefer plain typed data and pure functions. Value objects (`Credits`, branded IDs) are immutable and validate on creation. Domain services are stateless and pure.
  - `application/` has one use-case class per file, constructor-injected ports, and a single `execute()`.
  - `infrastructure/` and `integrations/` are classes implementing ports. Cross-cutting behaviour is added with decorators.
- Inheritance ONLY for the `DomainError` hierarchy. Composition everywhere else. No `BaseRepository<T>` or `BaseService`.
- Vendor SDKs (`@fal-ai/*`, `openai`, `@vercel/blob`, `@upstash/*`, `resend`) are imported ONLY in `server/integrations/**`.
  `better-auth` is imported only in `server/modules/identity/**` and `features/auth/**`.
  `drizzle-orm` is imported ONLY in `infrastructure/`, `platform/db` and `server/queries/`.
- `server/container.ts` is the only place concrete classes are constructed. Use cases and domain code NEVER import it.
- Route handlers and workflow functions: compose wrappers (`withErrorHandling`, `withRequestContext`, `withUser`,
  `withRateLimit`, `withIdempotency`) → parse with zod → call a use case → map the response. No business logic.
- **Async generation:** never wait for a provider inside a request. Submit via the workflow, return **202**, and let the client poll the read model.
- **Asset lifecycle** is a table-driven state machine (`queued → submitted → running → persisting → succeeded | failed`, `failed → queued` on retry).
  Transitions are saved with guarded updates (`UPDATE … WHERE id = $1 AND status = $expected`), so a retried step can never apply a transition twice.
- **Providers** ([ADR-018](docs/adr/018-lean-core-for-the-24-hour-build.md)): the generation workflow submits to fal, polls its status with `step.sleep` until it finishes or times out,
  then persists the output to Blob straight away. fal results expire (about 1 hour; about 6 minutes for outputs of 10 KB or more).
- **Money path:** in one `UnitOfWork` transaction, lock the user's credit account row (`FOR UPDATE`), check and record the video caps,
  append the `reserve` ledger entry with an idempotency key, and create the assets. After commit, send the generation events.
  Capture on success, release on final failure.
- Transactions cross module APIs as an opaque `Tx` type from `platform/db`, so Drizzle types never reach `application/`.
- Resilience: retries, timeouts and fallback order come from `platform/config/resilience.ts` and the model registry. Never hard-code them.
- Reads: RSC and GET routes use `server/queries` (flat DTOs, optimised SQL). Writes use repositories + aggregates (CQS).

## 7. Architecture rules (frontend)

- Server Components by default. `"use client"` only for interactive islands.
- Layers: `app → features → entities → shared → contracts`. Features never import each other. Import slices only via `index.ts`.
- Reads in RSC call the read queries directly; mutations go through `/api/v1` via `shared/lib/apiClient`.
- State homes: server state = TanStack Query; URL state = nuqs; forms = react-hook-form + zod contracts; everything else = `useState`/`useReducer`. No global stores.
- `useProject()` polls every 2s with `If-None-Match` and stops automatically when all assets are terminal.
- Money-spending mutations: the CALLER creates the `Idempotency-Key` once per user action and passes it in.
  Every button that spends credits shows its cost.
- Components receive view models, never raw DTOs. Status/variant/error handling uses exhaustive `satisfies Record<…>` maps.
- Every async region has designed loading, empty, error and success states. Status changes are announced through an `aria-live` region.
- Design system components come from `shared/ui` only. Never import Radix directly in features.
- Functional composition only. No class components and no inheritance. The only frontend class is `ApiError`.

## 8. Code standards (whole app)

- TypeScript `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. No `any`, no floating promises, no swallowed errors, no unexplained `!`.
- Parse with zod at every trust boundary: HTTP bodies, provider responses, LLM output, env, API responses on the client.
- **DRY = one home per piece of knowledge:**
  - Shapes and enums live in `contracts/`, including the ad templates and their beats (`contracts/ad.ts`).
  - Models, capabilities and costs live in the routing module's registry.
  - Prompts are built only by `director`'s `PromptComposer`; other modules call it through `director`'s `index.ts`.
  - Error code → HTTP status lives in `platform/http/errorMap.ts`; error code → user copy lives in `shared/lib/apiErrors.ts`.
  - Do not abstract before the third use (rule of three).
- **SOLID:**
  - Extend via registry entries, strategies, decorators and map entries, not new `if/else` branches.
  - Keep ports narrow.
  - Every `MediaProvider` and `LLMProvider` implementation passes its suite in `tests/contracts`.
- Naming:
  - Use cases are verbs (`ProduceDirection`), ports are nouns (`MediaProvider`), and adapters are vendor-prefixed (`FalMediaProvider`).
  - Booleans read as questions (`isSettled`).
- Size signals: split functions over ~50 lines, components over ~150 lines, and files over ~250 lines.
- Comments explain WHY. Link the ADR for any architectural choice.

## 9. Testing

- Domain: unit tests for `CreditAccount`, the `Asset` state machine, `Project` selection, and the pricing and routing policies.
- Use cases: in-memory repositories + fake providers + a fake clock, for the money path (reserve → fail → release) and refinement lineage.
- Contracts: the fake and real `MediaProvider` and `LLMProvider` implementations run the shared suite.
- Integration (Neon test branch): two parallel reserves must not overdraw.
- Frontend: view models, `useProject` polling stop, error-state mapping (RTL + MSW).
- E2E (Playwright, `PROVIDERS=fake`): brief → 3 concepts → finish → refine → download. If time allows: guest work preserved after a magic-link sign-in.
- Deferred ([ADR-018](docs/adr/018-lean-core-for-the-24-hour-build.md)): the ~90% domain coverage gate, repository contract suites, and merge integration tests.

## 10. Commands

```bash
npm run dev                # Next.js dev server
npm run inngest:dev        # Inngest dev server (run alongside npm run dev)
npm run lint               # eslint (includes boundary rules)
npm run typecheck          # tsc --noEmit
npm test                   # vitest (unit + use case + contract)
npm run test:integration   # vitest against the Neon test branch
npm run test:e2e           # playwright, PROVIDERS=fake
npm run db:generate        # drizzle-kit generate (new migration from schema changes)
npm run db:migrate         # apply migrations
npm run demo:prod -- <id>  # make a finished production film the public demo (reads .env.prod)
npm run talent:seed -- --fake      # seed the fictional placeholder talent (local database)
npm run talent:prod -- talent      # seed the real talent pack from ./talent (reads .env.prod)
npm run bakeoff -- <stage>         # model bake-off: inputs | frames | videos | music | cut | page
npm run auth:generate      # regenerate the Better Auth schema into identity/infrastructure
```

## 11. Environment

All variables are validated by `src/server/platform/env.ts` at boot. Never read `process.env` elsewhere.

```
DATABASE_URL, DATABASE_URL_UNPOOLED, DATABASE_URL_TEST
BETTER_AUTH_SECRET, BETTER_AUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
MAGIC_LINK_ENABLED, RESEND_API_KEY, EMAIL_FROM
PROVIDERS (fake | real)
OPENAI_API_KEY, DIRECTOR_MODEL
FAL_KEY
INNGEST_EVENT_KEY, INNGEST_SIGNING_KEY
BLOB_READ_WRITE_TOKEN, BLOB_STORE_ID (either is enough; the store id uses Vercel's OIDC token)
UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
GUEST_VIDEO_CAP, USER_VIDEO_CAP, DAILY_SPEND_CAP_USD
NEXT_PUBLIC_APP_URL
```

With `PROVIDERS=fake`, the LLM, media, storage, rate limiting and email use in-process fakes, and only
`DATABASE_URL` and `BETTER_AUTH_SECRET` are required.

Only `NEXT_PUBLIC_*` variables may reach the client. Never commit `.env*` files. Keys go in `.env.local` or the
Vercel dashboard, never in chat.

## 12. Working process for agents

1. Read this file first. For module work, also read that module's `index.ts` and the relevant section of `docs/architecture.md`.
2. **Plan per vertical slice** (`docs/plan.md`): post the slice's plan (files, responsibilities, tests) as a chat
   message. WAIT for the user's typed approval, then build
   the whole slice. Stop early only for a rule conflict, a failing check, or a decision that belongs to the user;
   ask those through AskUserQuestion popups.
3. Build inside-out within a slice: contracts → domain (+ tests) → ports → application (+ tests with fakes) → infrastructure/integrations → delivery → UI. Deploy at the end of every slice.
4. Use `PROVIDERS=fake` for all UI work. Real providers only at integration checkpoints.
5. Before declaring done: `npm run lint && npm run typecheck && npm test` must pass.
6. Use Conventional Commits (`feat(production): …`, `fix(credits): …`, `docs(adr): …`).
   Never let a formatter or linter touch `.claude/`.
7. Never edit an applied migration. Never weaken a lint rule, type setting or test to make something pass. Raise it instead.
8. If a requested change conflicts with these rules, say so and propose an alternative rather than silently deviating.

## 13. Definition of Done

- [ ] Module boundaries respected (the boundary lint passes)
- [ ] Contracts updated; no ad-hoc types
- [ ] Invariants live in `domain/`, with tests; use cases tested with fakes
- [ ] Provider adapters pass the contract suites
- [ ] Ownership check on every read and write
- [ ] Money paths are transactional + idempotent; the concurrent-reserve integration test passes
- [ ] Loading / empty / error / success states designed; keyboard + screen-reader friendly
- [ ] Works on mobile width and in an incognito window (guest flow)
- [ ] Deployed, and the live link works for someone who is not signed in
- [ ] Lint, typecheck and tests green; Conventional Commit

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

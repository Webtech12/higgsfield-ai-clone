# Engineering Standards — Director (a Higgsfield AI rebuild)

> **Status:** current · **Related:** [`architecture.md`](./architecture.md), [`frontend.md`](./frontend.md), [`adr/`](./adr/README.md), [`/AGENTS.md`](../AGENTS.md)
>
> How code is written across the entire system: domain, application, infrastructure, API, workflows, database and frontend. `AGENTS.md` condenses these rules for coding agents.

---

## 1. One standard, applied per layer

One set of principles governs the whole application. What changes from layer to layer is the **paradigm that best expresses those principles**. Using one paradigm everywhere ("everything is a class" or "everything is a function") is a smell. Choosing deliberately per layer, and writing down why, is the senior move.

| Layer | Paradigm | Why |
|---|---|---|
| **Backend domain** (`server/modules/*/domain`) | **OOP: rich domain model.** Entities and aggregates encapsulate invariants; value objects are immutable; domain services are stateless and pure | Invariants (legal state transitions, no overdrafts, one selected direction) must be *impossible to bypass*. Encapsulation is the right tool for that |
| **Backend application** (`server/modules/*/application`) | **OOP: use-case classes** with constructor-injected ports and a single `execute()` | Explicit dependencies, trivial to unit-test with fakes, one reason to change per class |
| **Ports** (`server/modules/*/ports`) and **module public APIs** (`server/modules/*/index.ts`) | Interfaces / facades | Abstraction, dependency inversion, stable module boundaries |
| **Infrastructure / integrations** (`server/modules/*/infrastructure`, `server/integrations`) | **OOP: classes implementing ports**, plus decorators | Hold clients and config; substitutable; wrappable with cross-cutting behaviour |
| **HTTP handlers & workflow functions** | Thin functions composed with higher-order wrappers | They're the delivery mechanism. They translate and delegate, and never decide |
| **Contracts** (`contracts/`) | Declarative zod schemas | Shapes are data, not behaviour |
| **Frontend** (`app/`, `features/`, `entities/`, `shared/`) | **Functional composition**: components, hooks, pure view-model functions | React's model is composition. Class components and inheritance are legacy patterns there, and would be flagged in review |

Rules that hold in **every** layer: SOLID, DRY (as knowledge), composition over inheritance, immutability by default, fail fast at boundaries, and explicit dependencies.

---

## 2. OOP in the backend

### 2.1 The four pillars, and where each is used

| Pillar | Where | Rule |
|---|---|---|
| **Encapsulation** | Entities (`Asset`, `Project`), aggregates (`CreditAccount`), value objects (`Credits`, `ShotDuration`) | State is private; it changes only through intention-revealing methods ("tell, don't ask") |
| **Abstraction** | Ports (`MediaProvider`, `LLMProvider`, repositories) | Callers know *what*, never *how* |
| **Polymorphism** | Multiple `MediaProvider` implementations; `ModelRoutingPolicy` strategies; decorators | Behaviour varies by substituting objects, not by `if (provider === "fal")` |
| **Inheritance** | **Only** the domain error hierarchy (`DomainError → …`) | Everywhere else: composition. No `BaseRepository<T>`, no `BaseService`, no inheritance chains |

### 2.2 Value objects: make invalid values unrepresentable

```ts
// server/modules/credits/domain/Credits.ts
export class Credits {
  private constructor(readonly value: number) {}

  static of(n: number): Credits {
    if (!Number.isInteger(n) || n < 0) throw new InvalidValueError("Credits", n);
    return new Credits(n);
  }
  plus(other: Credits): Credits  { return Credits.of(this.value + other.value); }
  minus(other: Credits): Credits { return Credits.of(this.value - other.value); } // throws below zero
  covers(cost: Credits): boolean { return this.value >= cost.value; }
  equals(other: Credits): boolean { return this.value === other.value; }
}
```

Other value objects include `ShotDuration` (4 or 5 s, per the model registry), `CameraMotion` (backed by the shared enum), `ProviderRequestId`, `StorageKey`, and branded ID types (`ProjectId`, `AssetId`), which prevent passing a shot ID where an asset ID is expected.

### 2.3 Entities: invariants live inside

```ts
// server/modules/production/domain/Asset.ts
const TRANSITIONS = {
  queued:     ["submitted", "failed"],
  submitted:  ["running", "persisting", "failed"],
  running:    ["persisting", "failed"],
  persisting: ["succeeded", "failed"],
  succeeded:  [],
  failed:     ["queued"],                     // user retry
} as const satisfies Record<AssetStatus, readonly AssetStatus[]>;

export class Asset {
  private constructor(private props: AssetProps) {}

  static createVideo(shot: ShotRef, model: ModelId, cost: Credits, parent?: AssetId): Asset { /* status: queued */ }
  static rehydrate(props: AssetProps): Asset { return new Asset(props); }

  get id() { return this.props.id; }
  get status() { return this.props.status; }
  get version() { return this.props.rowVersion; }      // optimistic concurrency

  markSubmitted(requestId: ProviderRequestId) { this.transitionTo("submitted"); this.props.providerRequestId = requestId; }
  markPersisting()                            { this.transitionTo("persisting"); }
  markSucceeded(key: StorageKey)              { this.transitionTo("succeeded"); this.props.storageKey = key; }
  markFailed(reason: FailureReason)           { this.transitionTo("failed"); this.props.failure = reason; }
  requeueForRetry()                           { this.transitionTo("queued"); this.props.failure = undefined; }

  private transitionTo(next: AssetStatus) {
    const allowed: readonly AssetStatus[] = TRANSITIONS[this.props.status];
    if (!allowed.includes(next)) throw new IllegalTransitionError(this.props.status, next);
    this.props.status = next;
  }

  toSnapshot(): Readonly<AssetProps> { return { ...this.props }; }
}
```

The transition table is **data**, so adding a state is an entry, not new branching (open/closed). It's also exhaustively type-checked. Persistence adds a second, database-level guard: the repository saves with `WHERE id = $1 AND row_version = $2` (optimistic locking). Duplicate webhooks or retried workflow steps therefore can't double-apply a transition, whether in memory or in the database.

### 2.4 Aggregates protect cross-entity rules

```ts
// server/modules/credits/domain/CreditAccount.ts
export class CreditAccount {
  constructor(readonly userId: UserId, private balance: Credits) {}

  reserve(cost: Credits, assetId: AssetId): LedgerEntry {
    if (!this.balance.covers(cost)) throw new InsufficientCreditsError(cost, this.balance);
    this.balance = this.balance.minus(cost);
    return LedgerEntry.reserve(this.userId, cost, assetId);   // idempotency key derived inside
  }
  release(cost: Credits, assetId: AssetId): LedgerEntry { /* … */ }
}
```

```ts
// server/modules/projects/domain/Project.ts (excerpt)
selectDirection(directionId: DirectionId): readonly Shot[] {
  if (this.props.status !== "planned") throw new ProjectNotReadyError(this.id);
  if (this.props.selectedDirectionId) throw new DirectionAlreadySelectedError(this.id);
  const direction = this.findDirection(directionId);            // throws if not in this project
  this.props.selectedDirectionId = direction.id;
  this.props.status = "producing";
  return direction.shots;
}
```

Use cases never reach through object graphs (`project.directions[i].shots[j].prompt = …`). They ask the aggregate to perform the operation. This follows the Law of Demeter, and it's why the invariants can't be bypassed.

### 2.5 Domain services: pure policies

Logic that doesn't belong to a single entity lives in stateless domain services with no I/O:
- `PricingPolicy.videoCost(model, duration): Credits`
- `ModelRoutingPolicy.select(needs): RoutingDecision` (Strategy pattern; §5)
- `PromptComposer.forFrame(elements, shot, direction): string`, the **one** place prompts are assembled (DRY)
- `LedgerCalculator.balance(entries): Credits`

### 2.6 Domain errors: the one justified hierarchy

```ts
export abstract class DomainError extends Error {
  abstract readonly code: DomainErrorCode;          // stable, maps 1:1 to the API envelope
  readonly retryable: boolean = false;
}
export class InsufficientCreditsError extends DomainError { readonly code = "INSUFFICIENT_CREDITS"; /* … */ }
export class IllegalTransitionError   extends DomainError { readonly code = "ILLEGAL_TRANSITION"; }
export class ProjectNotReadyError     extends DomainError { readonly code = "PROJECT_NOT_READY"; }
```

---

## 3. SOLID across the backend

### S — Single Responsibility

Each unit has one reason to change:

| Unit | Its only job |
|---|---|
| Route handler | HTTP ↔ command translation |
| Use case (`ProduceDirection`) | Orchestrating one business operation |
| Aggregate (`Project`, `CreditAccount`) | Enforcing its invariants |
| Repository | Persisting and loading one aggregate |
| Mapper (`AssetMapper`) | Row ↔ entity ↔ DTO conversion |
| Adapter (`FalMediaProvider`) | Talking to one vendor |
| Workflow function | Durable sequencing: calls use cases step by step, decides nothing |

```ts
// server/modules/production/application/ProduceDirection.ts
export class ProduceDirection {
  constructor(private readonly d: {
    uow: UnitOfWork;        // platform
    outbox: Outbox;         // platform
    assets: AssetRepository;// this module's own repository
    projects: ProjectsApi;  // other modules: public-API interfaces only
    credits: CreditsApi;
    limits: LimitsApi;
    routing: RoutingApi;
  }) {}

  async execute(cmd: ProduceDirectionCommand): Promise<{ assetIds: AssetId[] }> {
    await this.d.limits.assertCanGenerate(cmd.userId, { videos: 3 });

    const assets = await this.d.uow.run(async (tx) => {
      // Cross-module writes go through public APIs and share the same transaction.
      const shots = await this.d.projects.startProduction(tx, { projectId: cmd.projectId, userId: cmd.userId });

      const created = shots.map((shot) => {
        const { model } = this.d.routing.selectModel({ kind: "image-to-video", duration: shot.duration, intent: shot.intent });
        return Asset.createVideo(shot.ref, model, this.d.routing.priceOf(model, shot.duration));
      });

      await this.d.credits.reserveMany(tx, cmd.userId, created.map((a) => ({ assetId: a.id, cost: a.cost }))); // row lock + ledger
      await this.d.assets.addMany(tx, created);
      await this.d.outbox.addMany(tx, created.map((a) => AssetGenerateRequested(a.id)));                     // same transaction
      return created;
    });

    return { assetIds: assets.map((a) => a.id) };
  }
}
```

The use case depends on **interfaces** of other modules (`ProjectsApi`, `CreditsApi`), not on their classes or tables. Events are written to the **transactional outbox** in the same database transaction and relayed to Inngest, which eliminates the "committed but event never sent" failure mode ([`architecture.md` §7.2](./architecture.md#72-transactional-outbox), [ADR-006](./adr/006-transactional-outbox.md)).

### O — Open/Closed

Extend by **adding**, not editing:
- **New model:** add an entry to `modelRegistry`. Routing, pricing and the UI (which reads costs from the API) are untouched.
- **New provider:** add a `ReplicateMediaProvider` class. It must pass the contract suite. Nothing else changes.
- **New cross-cutting behaviour** (metrics, caching, circuit breaking): wrap with a decorator; the wrapped class doesn't change.
- **New asset state or error code:** add a table entry; exhaustive `satisfies Record<…>` maps force every consumer to handle it at compile time.

```ts
// Decorator: adds observability without modifying any provider
export class InstrumentedMediaProvider implements MediaProvider {
  constructor(private readonly inner: MediaProvider, private readonly metrics: Metrics, private readonly log: Logger) {}
  async submit(req: GenerationRequest, opts: SubmitOptions) {
    const started = Date.now();
    try {
      const res = await this.inner.submit(req, opts);
      this.metrics.timing("media.submit", Date.now() - started, { model: req.model });
      return res;
    } catch (err) {
      this.log.error("media.submit.failed", { model: req.model, err });
      throw err;
    }
  }
  status(id: ProviderRequestId) { return this.inner.status(id); }
  parseWebhook(raw: Request)    { return this.inner.parseWebhook(raw); }
}
```

### L — Liskov Substitution

Any implementation of a port must be usable wherever the port is expected, **with no special-casing by callers**. This is enforced, not hoped for:

```ts
// tests/contracts/mediaProvider.contract.ts
export function mediaProviderContract(name: string, make: () => MediaProvider) {
  describe(`${name} satisfies MediaProvider`, () => {
    it("returns a request id on submit", /* … */);
    it("reports terminal status for completed jobs", /* … */);
    it("rejects webhooks with invalid signatures", /* … */);
    it("maps vendor failures to ProviderFailure, never raw vendor errors", /* … */);
  });
}
mediaProviderContract("FakeMediaProvider", () => new FakeMediaProvider());
mediaProviderContract("FalMediaProvider", () => new FalMediaProvider(testConfig));   // runs against a sandbox/recorded fixtures
```

A classic LSP violation to avoid is an adapter that throws "unsupported duration." Capabilities are declared in the **registry**, and the routing policy never selects a model for a request it can't serve. Subtypes don't strengthen preconditions.

The same rule applies to repositories: the in-memory repositories used in use-case tests pass the same repository contract suite as the Drizzle ones.

### I — Interface Segregation

- **Narrow ports:** `MediaProvider`, `LLMProvider`, `ObjectStorage`, `RateLimiter`, `EventBus`, `Clock`. There's no `AIService` god-interface.
- **One repository per aggregate** (`ProjectRepository`, `AssetRepository`, `CreditRepository`), not a generic `Repository<T>` exposing methods most callers shouldn't use.
- **Reads are separated from writes (CQS).** Command-side repositories load and save aggregates. The read side (`ProjectQueries.getWorkspaceView(id)`) returns flat DTOs straight from optimised SQL for the frontend's read model. Commands change state and return only IDs, while queries never change state. This lightweight CQRS is also what makes the polling endpoint cheap.
- Use cases declare only the ports they actually use in their constructor type.

### D — Dependency Inversion

- Within a module, `domain` depends on nothing.
- `application` depends on `domain`, its own `ports`, and other modules' **public-API interfaces**.
- `infrastructure` depends on `ports` + Drizzle.
- `server/integrations` depend on `ports` + vendor SDKs.
- **One composition root** wires everything, and it's the only place concrete classes are constructed:

```ts
// server/container.ts — the only file that constructs concrete classes
const db = createDb(env.DATABASE_URL);
const uow = new DrizzleUnitOfWork(db);
const outbox = new DrizzleOutbox();

// integrations (adapters), decorated where useful
const media = new InstrumentedMediaProvider(
  env.MEDIA_PROVIDER === "fake" ? new FakeMediaProvider() : new FalMediaProvider({ apiKey: env.FAL_KEY, webhookSecret: env.FAL_WEBHOOK_SECRET }),
  metrics, logger,
);
const llm = new AnthropicLLMProvider({ apiKey: env.ANTHROPIC_API_KEY, model: env.DIRECTOR_MODEL });
const storage = new R2Storage(env.r2);
const rateLimiter = new UpstashRateLimiter(env.upstash);

// modules, built bottom-up along the (acyclic) dependency graph; each factory returns the module's public API
const identity   = createIdentityModule({ db, outbox });
const routing    = createRoutingModule({ registry: modelRegistry });
const mediaStore = createMediaModule({ storage });
const credits    = createCreditsModule({ db });
const limits     = createLimitsModule({ db, rateLimiter, config: env.limits });
const projects   = createProjectsModule({ db, outbox });
const production = createProductionModule({ uow, outbox, media, mediaStore, projects, credits, limits, routing });
const storyboard = createStoryboardModule({ uow, projects, production, routing });
const director   = createDirectorModule({ uow, llm, projects });
const remix      = createRemixModule({ uow, llm, projects, production, routing, credits, limits });

export const modules = { identity, routing, mediaStore, credits, limits, projects, production, storyboard, director, remix } as const;
```

- **Handlers and workflow functions may import `modules`** (they're the outer shell). **Use cases and domain code never import the container.** Doing so would be the Service Locator anti-pattern and would hide their dependencies.
- No DI framework: constructor injection plus one composition root is simpler and fully type-checked.

---

## 4. DRY across the whole application

**DRY means every piece of *knowledge* has one authoritative home.** It doesn't mean deduplicating every similar-looking line.

| Knowledge | Single home | Consumers |
|---|---|---|
| Enums (asset status, camera motion, error codes) | `contracts/enums.ts` | DB check constraints (generated in migrations), zod schemas, LLM tool schema, domain types, UI status maps |
| API shapes | `contracts/*.ts` | Route handlers (parse input/output), frontend API client, tests |
| Models, capabilities, costs, fallbacks | `server/modules/routing/config/modelRegistry.ts` | Routing, pricing, validation, the cost the UI displays (served by the API) |
| Prompt assembly | `PromptComposer` (director module) | Planning, frames, videos, remix |
| Error code → HTTP status | `server/platform/http/errorMap.ts` (`satisfies Record<DomainErrorCode, number>`) | Every handler, via `withErrorHandling` |
| Error code → user copy | `shared/lib/apiErrors.ts` | Every UI error state |
| Retry and timeout policy | `server/platform/config/resilience.ts` | Workflows and adapters |
| Cross-cutting HTTP concerns | Composable handler wrappers | Every route |
| Row ↔ entity ↔ DTO conversion | One mapper per aggregate | Repositories, queries |
| Design values | CSS token variables | All UI |

**Cross-cutting concerns are written once and composed (Decorator pattern at the HTTP layer):**

```ts
// app/api/v1/projects/[projectId]/productions/route.ts
export const POST = compose(withErrorHandling, withRequestContext, withUser, withRateLimit("produce"), withIdempotency)(
  async (req, ctx) => {
    const input = ProduceDirectionInput.parse(await req.json());
    const result = await modules.production.produceDirection({
      ...input, projectId: ctx.params.projectId, userId: ctx.user.id,
    });
    return accepted(ProduceDirectionResponse.parse(result));
  },
);
```

Every handler looks like this: parse, execute, respond. User resolution, rate limiting, idempotency, correlation IDs and error mapping each exist exactly once.

**The counterweight is AHA ("avoid hasty abstractions") and the rule of three.** Two things that *look* alike but change for different reasons (a frame generation request vs a video generation request, or a Board shot card vs a Studio timeline item) stay separate until a third case proves the shared shape. Duplication is cheaper than the wrong abstraction.

---

## 5. Design pattern catalogue

Each pattern is used because a specific problem calls for it, never decoratively.

| Pattern | Where | Problem it solves |
|---|---|---|
| **Modular monolith** | `server/modules/*` | Bounded contexts in one deployable; extractable later |
| **Facade** | Each module's `index.ts` | A stable, narrow public API per module |
| **Hexagonal / Ports & Adapters** | Inside every module | Vendor independence, testability |
| **Rich domain model / Aggregate** | `Project`, `CreditAccount`, `Asset` | Invariants that can't be bypassed |
| **Value Object** | `Credits`, `ShotDuration`, branded IDs | Invalid values unrepresentable |
| **State (table-driven)** | Asset lifecycle | Legal transitions, idempotency |
| **Repository + Mapper** | Per aggregate | Persistence ignorance in the domain |
| **Unit of Work** | `DrizzleUnitOfWork` | Atomic multi-aggregate changes (credits + assets + outbox) |
| **Transactional Outbox** | Event publishing | No lost events between commit and publish |
| **Inbox** | Provider webhooks | Idempotent, replayable ingestion |
| **Idempotency Key** | Money-spending POSTs | No double charges |
| **Strategy** | `ModelRoutingPolicy`, `PricingPolicy` | Swappable decision logic (Smart Select) |
| **Adapter** | `FalMediaProvider`, `AnthropicLLMProvider`, `R2Storage` | Translate vendor APIs to our ports |
| **Decorator** | `InstrumentedMediaProvider`, HTTP wrappers | Cross-cutting concerns without modification |
| **Factory** | `Asset.createVideo`, adapter selection in the composition root | Controlled construction, valid initial state |
| **Composition Root** | `server/container.ts` | Explicit wiring in one place |
| **CQS / light CQRS** | Command repositories vs `ProjectQueries` | Cheap reads, clean writes |
| **Container / Presentational** (frontend) | Feature hooks + dumb components | Testable UI, separated concerns |
| **Compound Components** (frontend) | `ShotCard.*` | Composition without boolean props |
| **Custom Hooks** (frontend) | `useProject`, `useRemixShot` | Reusable stateful logic |

---

## 6. Other principles, applied everywhere

- **Separation of concerns:** delivery (HTTP, workflows, UI) never contains business rules.
- **Tell, don't ask:** `asset.markSucceeded(key)`, not `if (asset.status === …) asset.status = …`.
- **Law of Demeter:** use cases talk to aggregates, not to their internals; components receive view models, not raw aggregates.
- **Composition over inheritance:** decorators, strategies, hooks and compound components.
- **Immutability by default:** value objects, DTOs, view models and React state are immutable. Entity mutation is encapsulated and persisted through the unit of work.
- **Fail fast at boundaries:** env validated at boot; every HTTP body, webhook, LLM output and API response parsed with zod.
- **Make illegal states unrepresentable:** branded IDs, value objects, discriminated unions, exhaustive maps.
- **12-factor config:** all config comes from env, validated once. The same build runs locally (fake provider), in preview and in production.
- **Defence in depth for invariants:** the domain enforces them, and database constraints (unique keys, check constraints, foreign keys) enforce them again.

---

## 7. Anti-patterns banned in review

- **Anemic "god services":** e.g. an 800-line `GenerationService` holding all logic while entities are bags of fields.
- **Business logic in handlers, workflow functions or React components.**
- **Inheritance for reuse:** `BaseRepository<T>`, `BaseUseCase`, abstract controllers, React class components.
- **Service Locator:** importing the container inside use cases or domain code.
- **Vendor SDK imports outside `server/integrations/`**, or `drizzle-orm` outside `infrastructure/` and `platform/db`.
- **Reaching into another module:** importing its internals or querying its tables instead of calling its `index.ts`.
- **Reading cookies or headers inside use cases:** the user ID is passed in explicitly.
- **Boolean flag parameters** (`generate(shot, true, false)`); use options objects or separate methods.
- **Magic strings and numbers:** statuses, costs and durations come from contracts or the registry.
- **Swallowed errors** (`catch {}`) and unhandled promises.
- **`any`, non-null assertions (`!`) without a comment, and type casts in place of parsing.**
- **Premature generic abstractions** made before the third use case.

---

## 8. Testing strategy

| Level | Target | Tools | Notes |
|---|---|---|---|
| **Domain unit** | Entities, value objects, policies, state table | Vitest | The fastest and most numerous tests. Coverage gate ~90% on `server/modules/*/domain` only |
| **Use case** | Application classes | Vitest + in-memory repos + `FakeMediaProvider` + fake clock | Business flows without I/O: reserve → fail → release, remix lineage, caps |
| **Contract** | Every adapter and repository implementation | Shared suites (§3 L) | Enforces substitutability |
| **Integration** | Drizzle repos, UoW, outbox, row locking | Real Postgres (a Neon branch or Testcontainers) | Proves the concurrency guarantees: two parallel reserves can't overdraw; the outbox relay publishes exactly once; the guest merge is idempotent |
| **Frontend** | View models, hooks, key components | Vitest + RTL + MSW | Polling stop, optimistic rollback, error-state mapping |
| **End-to-end** | One critical journey | Playwright, `MEDIA_PROVIDER=fake` | Brief → board → produce → remix one shot → playback |

---

## 9. Enforcement

| Standard | Mechanism |
|---|---|
| Layer boundaries (backend + frontend) | `eslint-plugin-boundaries` element types: `domain`, `application`, `ports`, `adapters`, `delivery`, `feature`, `entity`, `shared`, `contracts`, each with an allowed-dependency matrix |
| Module boundaries | `eslint-plugin-boundaries`: another module is importable only via `server/modules/<m>/index.ts`; no cycles (plus `import/no-cycle`) |
| Vendor isolation | `no-restricted-imports`: `@fal-ai/*`, `@anthropic-ai/*`, `@aws-sdk/*`, `@upstash/*`, `resend` only under `server/integrations/**`; `drizzle-orm` only under `**/infrastructure/**` and `server/platform/db/**`; `better-auth` only under `server/modules/identity/**`, `server/platform/auth/**` and `features/auth/**` |
| No container in inner layers | `no-restricted-imports` of `server/container` from `server/modules/**/domain/**` and `server/modules/**/application/**` |
| Client/server separation | `import "server-only"` in `server/**`; boundary lint |
| Type safety | `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`; `@typescript-eslint/strict-type-checked`; `no-explicit-any: error`; `no-floating-promises: error` |
| Size signals | `max-lines` (warn ~250), `max-lines-per-function` (warn ~50), `complexity` (warn ~10) |
| Formatting and hygiene | Prettier; husky + lint-staged |
| CI gate on every push | lint → typecheck → domain/use-case tests → contract tests → integration tests → Playwright smoke → build |
| History | Conventional Commits; ADRs in `docs/adr/` for every decision in §1 and §5 |

---

## 10. Review checklist (whole application)

- [ ] Business rules live in the domain; handlers, workflows and components only translate and delegate
- [ ] New behaviour added by extension (registry entry, strategy, decorator, map entry), not by editing branching logic
- [ ] New adapters/repositories pass their contract suites
- [ ] Ports stay narrow; use cases declare only what they use
- [ ] Concrete classes constructed only in `server/container.ts`
- [ ] Cross-module access only via public `index.ts`; no foreign-table queries
- [ ] Ownership (`userId`) checked on every read and write
- [ ] Knowledge has one home (contracts, registry, composer, error maps); no premature abstractions
- [ ] Invariants enforced in the domain *and* backed by DB constraints
- [ ] Money paths are idempotent, transactional, and covered by an integration test
- [ ] Every trust boundary parses input with zod; no `any`, no swallowed errors
- [ ] Frontend: layering respected, state in its correct home, all async states designed and accessible
- [ ] ADR added or updated if an architectural decision changed

---

## 11. Agent rules

The operational rules for coding agents live in [`/AGENTS.md`](../AGENTS.md), which `CLAUDE.md` imports. When a rule in this document changes, update `AGENTS.md` in the same commit.

---

## 12. Time impact and how to protect it

The rich domain model, contract suites, outbox and handler wrappers add roughly 2 hours on top of the architecture plan. They also make the agent's output far more predictable, because every new feature follows the same shape. To keep the 24-hour window safe:

1. Build `domain/`, `ports/`, the fakes and the contract suites **first** (Phase 2). Everything after that is filling in known shapes.
2. Do all UI work against `MEDIA_PROVIDER=fake`, and switch to real providers only for integration checkpoints.
3. If you fall behind, cut *features* (per the execution plan's cut list), **never** the money path's correctness or the layer boundaries. Those are what this role is being assessed on.

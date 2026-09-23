# ADR-019: Module boundary corrections

- **Status:** Accepted
- **Date:** 2026-09-23
- **Related:** [`AGENTS.md` §3](../../AGENTS.md) · amends [ADR-001](./001-modular-monolith.md) and [ADR-009](./009-better-auth-guest-accounts.md)

## Context

A review of the original design found six places where the documented behaviour broke its own module rules:

1. The `identity` guest-merge workflow updated `projects` and `credits` data, although identity may depend on nothing and both of those depend on identity. That is a cycle.
2. Deleting the anonymous user after a merge fails. Its append-only ledger rows reference it.
3. The `project.plan` workflow (director) called `storyboard.generateFrames`, which director may not import.
4. `PromptComposer` lives in director, but frames, videos and remix, built by modules that could not depend on director, all need it. Remix even called the LLM directly.
5. `getWorkspaceView` lived in `projects` but must show asset statuses owned by `production`, which projects cannot depend on.
6. `selectDirection` set the project status to `producing` before anything was produced.

## Decision

1. Workflows that coordinate several modules are **processes** in `server/processes/` (`mergeGuest`, `onboarding`). A process may depend on any module through its public API; no module depends on a process. `onLinkAccount` only records a `pending` row in `guest_merges` and sends `identity/guest.linked`.
2. The anonymous user is **never deleted**. It is marked merged in `guest_merges`, and its ledger history stays intact.
3. Director's plan workflow ends with `step.sendEvent("project/planned")`, and storyboard's frame workflow reacts to it.
4. `storyboard`, `production` and `remix` may depend on `director` (director depends only on `projects`, so there is no cycle). Every prompt is composed through `director`'s public API; remix calls `director.rewriteShot`.
5. Read models that span modules live in `server/queries/`, the only code allowed to SELECT across module tables. It never writes.
6. Project status gains `selected`: `planning → planned → selected → producing → ready | failed`. `selectDirection` belongs to the `Project` aggregate, exposed by `projects`.

## Alternatives considered

- **Choreography for the merge** (each module subscribes to `guest.linked`): acyclic, but completion tracking is spread across modules.
- **Denormalising asset status into `projects` by events**: adds event lag to the 2-second polling loop.
- **Moving `PromptComposer` into `contracts/`**: contracts hold shapes, not behaviour.

## Consequences

The dependency graph is acyclic and matches the code. Two new top-level folders exist (`processes`, `queries`) with narrow, explicit rules. Anonymous user rows accumulate; that is acceptable at this scale.

## Revisit when

A process grows domain rules of its own (promote it to a module), or read queries become slow (add projections).

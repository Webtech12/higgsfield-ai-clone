# ADR-018: Lean core for the 24-hour build

- **Status:** Accepted
- **Date:** 2026-09-23
- **Related:** [`assignment.md`](../assignment.md) · [`plan.md`](../plan.md) · supersedes [ADR-005](./005-webhooks-inbox-reconciliation.md) and [ADR-006](./006-transactional-outbox.md) · amends [ADR-011](./011-immutable-versioned-assets.md)

## Context

The assignment is judged on speed (how much working product ships), product judgement and UX. Architecture is not a judging criterion. The original design spent hours on infrastructure that protects nobody at MVP scale: an outbox table and relay, a webhook inbox, row-version locking, contract suites for every repository, Sentry and a coverage gate. The live app spends real money and is open to anyone, so the parts that protect users and spend must stay.

## Decision

Keep:
- the module boundaries and public `index.ts` APIs;
- provider ports with fakes;
- durable Inngest workflows;
- the transactional credit reservation;
- caps and the spend kill-switch;
- the guest merge.

Simplify:
- **No outbox table.** Inside Inngest functions, chain with `step.sendEvent`, which is durable. From request handlers, send the event after commit. The entity's own status (an asset still `queued`, a merge still `pending`) is the durable record, and a one-minute sweep re-sends anything stuck.
- **No provider webhooks or inbox.** The generation workflow polls fal's queue status with `step.sleep`, then persists the output to R2 straight away, because fal results expire.
- **Guarded updates instead of row versions.** Asset transitions save with `WHERE id = $1 AND status = $expected`.
- **A rich domain model only where invariants matter:** `CreditAccount`, `Asset` and `Project`.
- **Tests:** unit tests for those invariants, use-case tests with fakes, contract suites for `MediaProvider` and `LLMProvider` only, one concurrency integration test (parallel reserves) and one Playwright journey.
- **Deferred:** Sentry (pino logs remain), the ~90% domain coverage gate, and repository contract suites.

## Alternatives considered

- **Build the full design as written**: the strongest architecture story, but it costs hours of product and UX time that the brief rewards.
- **A plain app with no boundaries or ledger**: the most product per hour, but double charges and runaway spend become possible on a public link.

## Consequences

Faster delivery with the same user-facing guarantees: no lost jobs, no double charges, no overdrafts. Polling adds a few seconds of latency and some provider status calls. The sweep is a small amount of code to get right.

## Revisit when

After the submission, or once traffic makes polling costly. Then restore webhooks with ED25519/JWKS signature verification, plus the inbox.

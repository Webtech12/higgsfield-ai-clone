# ADR-009: Better Auth with guest (anonymous) accounts and a deferred merge

- **Status:** Accepted; amended by [ADR-019](./019-module-boundary-corrections.md) (the merge runs as a process; the anonymous user is kept) and [ADR-022](./022-no-custom-domain-yet.md) (Google-only sign-in live)
- **Date:** 2026-09-23
- **Related:** [`architecture.md`](../architecture.md) · [`standards.md`](../standards.md)

## Context

Graders must use the app without signing in, but a real product needs accounts (Google, email). Guest work must survive sign-in. Auth.js is now maintained by the Better Auth team, who recommend Better Auth for new projects.

## Decision

Use Better Auth with the Drizzle adapter and the `anonymous`, Google OAuth and `magicLink` (via Resend) plugins. Everyone is a user; guests have `isAnonymous = true`, and all domain data is owned by `user_id`. The guest identity is created on the first meaningful action, not on page load. Because `onLinkAccount` runs after the new session is issued and is not atomic, it only writes an `identity/guest.linked` outbox event. The `identity.mergeGuest` workflow then reassigns projects, transfers credits and grants the sign-up bonus, idempotently. `disableDeleteAnonymousUser` is set to true; the workflow deletes the anonymous user after a successful merge.

## Alternatives considered

- **Auth.js**: Now in maintenance under the Better Auth team, and it lacks first-class anonymous users.
- **Clerk (hosted)**: Fast to set up, but adds vendor lock-in and cost, and guest-to-account merges are harder to control.
- **Custom signed-cookie sessions**: Fine for guests only, but we'd rebuild OAuth and magic links ourselves.

## Consequences

No login wall, one ownership model, and a guest merge that's safe under failure. The UI must show a transitional "moving your guest work" state.

## Revisit when

We need organisations/teams, SSO or passkeys (all available as Better Auth plugins).

# ADR-016: Layered rate limits, caps and a global spend kill-switch

- **Status:** Accepted
- **Date:** 2026-09-23
- **Related:** [`architecture.md`](../architecture.md) · [`standards.md`](../standards.md)

## Context

The live app is public, generation costs real money, and guests can be created without credentials.

## Decision

The limits module enforces:
- per-IP rate limits on anonymous sign-in;
- per-user and per-IP sliding windows (Upstash);
- guest caps (tight) and user caps (looser), from configuration;
- a global daily spend cap checked before every provider submission.

When a limit is hit, the UI shows a designed state that offers sign-in or the demo project. Provider accounts also carry hard spending limits.

## Alternatives considered

- **A single global limit**: One abuser blocks everyone.
- **No limits for the demo**: Unacceptable financial risk.

## Consequences

Bounded cost and graceful degradation. Some legitimate heavy users will hit caps, which is acceptable for an MVP.

## Revisit when

Paid plans arrive; caps then come from plan entitlements.

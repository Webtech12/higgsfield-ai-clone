# ADR-022: No custom domain yet — r2.dev media and Google-only sign-in live

- **Status:** Accepted
- **Date:** 2026-09-23
- **Related:** amends [ADR-009](./009-better-auth-guest-accounts.md) and [ADR-010](./010-persist-media-r2.md)

## Context

There is no custom domain. Cloudflare serves a public R2 bucket through a custom domain or through the r2.dev subdomain, which is rate-limited and meant for development. Resend can only send to the account owner's address until a sending domain is verified. That breaks magic links for anyone else.

## Decision

- Serve media from the bucket's public **r2.dev** URL (`R2_PUBLIC_BASE_URL`), with unguessable object keys. This is recorded as a known limitation.
- On the live app, offer **Google sign-in only** (`MAGIC_LINK_ENABLED=false`). Magic link stays built and tested: the E2E suite signs in through it with a fake email sender.

## Alternatives considered

- **Buy a domain now**: removes both limitations but adds DNS setup to the critical path.
- **A private bucket with presigned URLs**: works without a domain, but URLs must be re-signed within the polling read model.

## Consequences

Graders can sign in with Google, and media loads for a demo-scale audience. Heavy traffic could hit r2.dev's rate limits.

## Revisit when

A domain is added. Then map R2 to it, verify it in Resend and set `MAGIC_LINK_ENABLED=true`.

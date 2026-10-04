# ADR-027: One free trial per network a day

- **Status:** Accepted
- **Date:** 2026-10-05
- **Related:** [ADR-016](./016-rate-limits-spend-kill-switch.md) · [ADR-009](./009-better-auth-guest-accounts.md) · [ADR-026](./026-realistic-frames-and-video.md)

## Context

Guests start with 40 credits (AGENTS.md §5) and never sign in. That left four holes:

- Opening an incognito window made a fresh guest with fresh credits.
- Better Auth's public route `/api/auth/sign-in/anonymous` made guests with no limit at all,
  skipping our routes.
- The per-IP limits were hourly and generous: 30 briefs an hour from one address, which is $10.80
  of storyboard frames.
- The limits were keyed by the full address, which an IPv6 visitor can change at will within their
  /64.

Only the $10 daily kill-switch bounded abuse, so one person could spend everyone's budget. ADR-026
then made each journey about ten times dearer.

## Decision

- **What counts as one network:**
  - An IPv4 address, or an IPv6 /64.
  - It's read from `x-forwarded-for`, which Vercel overwrites with the client's address.
  - Anything unreadable shares one bucket.
- **One free trial per network per UTC day:**
  - A trial is a new guest. The `guestAccess` process makes a guest only after
    `limits.assertTrialAvailable(network)`.
  - A refusal is `TRIAL_LIMIT_REACHED` (429): "Today's free trial on this network has been used.
    Carry on in the browser you started in, or come back tomorrow."
  - A visitor who already has a session is never refused.
- **Better Auth's anonymous route is closed:**
  - It's listed in Better Auth's `disabledPaths`.
  - Disabled paths only apply to its HTTP router, so the server's own `auth.api.signInAnonymous`
    still works. That call is now the only way a guest is made.
- **Daily allowances per network**, for free work that costs money. They replace the hourly per-IP
  limits:
  - 2 briefs (18 frames)
  - 6 redraws
  - 6 retries
  - 10 Polish with AI calls
  - 20 photo uploads

  A refusal is `DAILY_ALLOWANCE_REACHED` (429). Per-user hourly limits stay as burst control.
  Videos are bounded by the trial's credits and the per-guest video cap.
- **`POST /api/v1/session`:**
  - It starts the session before the first upload, Polish with AI or brief.
  - The browser shares one request between concurrent actions, so picking several photos makes one
    guest.
  - Before, each parallel upload made its own guest. The photos uploaded under the guests whose
    cookie didn't stick were then rejected at submit.
- **Storage:** counters live in Upstash with daily fixed windows, which line up with UTC days.
  Nothing new is stored in Postgres.

## Alternatives considered

- **A per-IP cap on guest creation only:** IPv6 addresses rotate inside a /64, and the free work
  (briefs, redraws) costs more than the credits.
- **Sign-in (Google) before credits:** the strongest fix, because accounts are much harder to mint
  than incognito windows. But sign-in isn't built yet (slice S6), and it puts a wall before the
  first ad.
- **Bot protection (Vercel BotID or a captcha):** it stops scripts, not a person opening windows,
  and it is a new dependency that needs its own ADR. It's a good next layer.
- **Device fingerprinting:** invasive, and private windows reset it anyway.

## Consequences

- **Worst case per network:** about $6.50 a day at ADR-026's prices: 2 briefs ($2.70), 6 redraws
  ($0.90), and the trial's 4 shots ($2.80) plus LLM calls. The kill-switch remains the ceiling.
- **Shared networks share one trial:** a household, an office, or many mobile users behind one
  carrier address (CGNAT). The second person is told to come back tomorrow.
- **Rotating networks:** VPNs, mobile reconnects and proxies get fresh networks. That bounds a
  casual abuser, not a determined one; sign-in or bot protection would be the next step.
- **E2E tests:** each test gets its own network through an `x-forwarded-for` header in the IPv6
  documentation range.

## Revisit when

- Legitimate visitors are turned away because they share a network.
- Abuse comes through rotating proxies: add bot protection, or sign-in before credits.
- Sign-in exists (S6): grant credits to accounts, and make the guest trial smaller.

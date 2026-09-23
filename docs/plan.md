# Build plan

Deadline: **2026-09-24 11:17 UTC**. The brief ([`assignment.md`](./assignment.md)) judges speed, product judgement and UX/UI. The build therefore goes in vertical slices, each ending deployed, so there is always a working live link. Fakes come first (`PROVIDERS=fake`), and real providers arrive in one integration slice.

Each slice's plan is posted in chat and approved by the user before it starts ([`AGENTS.md` §12](../AGENTS.md)).

## Slices

| # | Slice | Budget | Done when | Needs from the user |
|---|---|---|---|---|
| S0 | **Foundations**: spec review, brief, Higgsfield teardown, spec fixes, this plan | 2h | Committed ✅ | — |
| S1 | **Scaffold and deploy**: Next.js 16, TypeScript strict, Tailwind + shadcn with the dark theme tokens, ESLint (boundaries) + Prettier + husky, `env.ts` with fake mode, Drizzle + `pg` client, Vitest + Playwright smoke tests, GitHub Actions CI on Node 24, an app shell on Vercel | 1.5h | The live URL shows the shell; CI is green | Public GitHub repo, Vercel project, Neon project with a `test` branch |
| S2 | **Brief → Board (fakes)**: guest on first submit; projects, director (`PromptComposer`, fake LLM), storyboard frames through production with the fake media provider; the workspace read query + `useProject` polling; Brief page and Board (3 directions × 3 shots), selecting a direction, shot edits with **Redraw frame** | 3h | A brief shows 3 directions with 9 frames on the live link | — |
| S3 | **Produce → Studio (fakes)**: credits ledger and onboarding grants, caps and the kill-switch, `ProduceDirection`, the `asset.generate` polling workflow and the sweep, Studio with shot statuses, the sequential player and downloads; the concurrent-reserve integration test | 3h | Produce → 3 videos → playback on the live link | — |
| S4 | **Real providers**: OpenAI adapter (`gpt-6-sol`) and fal adapter with contract tests, model registry entries (IDs and prices approved by the user), R2 persistence, Inngest Cloud, Upstash, the seeded demo project with real media | 2h | A real brief yields real frames and videos on the live link, within the caps | OpenAI key with a usage limit, fal key with a spend limit, R2 bucket (r2.dev) + token, Inngest app, Upstash database |
| S5 | **Remix and versions**: `remixShot` via `director.rewriteShot`, the redraw-frame toggle, version strip, latest success becomes current, optimistic pending version with rollback | 2h | One shot remixed on the live link; older versions still playable | — |
| S6 | **Accounts**: Google sign-in, the `mergeGuest` process with the "Moving your guest work…" state, cap and out-of-credits states that offer sign-in, magic link built and hidden live | 2h | Guest work survives a Google sign-in on the live link | Google OAuth client with the live redirect URI |
| S7 | **Polish and submit**: a UX pass over every loading, empty and error state, mobile width, keyboard and screen reader; the Playwright journey; README; walkthrough script; submission checklist | 2h | Every item in the checklist below is ticked | Record the walkthrough |

S1–S7 total about 15.5 hours, leaving about 4 hours of buffer before the deadline.

## Cut list

If a slice runs over, cut from the top of this list. Each item is independent.

1. The magic-link E2E journey (Google sign-in stays).
2. Style chips on the brief (aspect ratio stays).
3. The remix **Also redraw the frame** toggle (remix becomes motion-only).
4. **Redraw frame** after a shot edit (edits apply at production).
5. The version strip (older versions stay stored but aren't browsable).
6. The guest → account merge (sign-in starts a fresh account; guest work stays under the guest).

Never cut:
- the core loop (brief → board → produce → remix one shot → playback)
- money-path correctness (no double charges, no overdrafts)
- the caps and the spend kill-switch
- a live link that works for someone who is not signed in

## Accounts, in the order they are needed

Keys go in `.env.local` and the Vercel dashboard, **never in chat**: every prompt is logged verbatim to the public `.agent-logs/`.

1. **S1:** GitHub (an empty public repo), Vercel (import the repo), Neon (a project plus a `test` branch).
2. **S4:** OpenAI (a key with a usage limit), fal (a key with a spend limit), Cloudflare R2 (a bucket with r2.dev public access and an S3 API token), Inngest (the Vercel integration), Upstash Redis.
3. **S6:** a Google OAuth client, with `https://<live-url>/api/auth/callback/google` as the redirect URI.

## Submission checklist (from the brief)

- [ ] The live link opens for somebody who is not signed in
- [ ] The repository is public, with `.agent-logs/` in it, and a final logs commit after the last session
- [ ] The walkthrough is under five minutes, camera on; the live link and the repository are labelled in the links field

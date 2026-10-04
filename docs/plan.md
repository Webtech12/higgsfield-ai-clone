# Build plan

Each slice's plan is posted in chat and approved by the user before it starts ([`AGENTS.md` §12](../AGENTS.md)).

## Now: the ad studio proof of concept

From 2026-10-04 Director is an ad studio with seeded, consenting talent
([ADR-024](./adr/024-ad-studio-with-consenting-talent.md)). S0–S4 below shipped the film version;
remix (S5) becomes A3's refinements, and accounts (S6) wait until talent or payments need them.

| # | Slice | Done when | Needs from the user |
|---|---|---|---|
| A0 | **Decide**: ADR-024, `AGENTS.md` §1 rewritten for ads, then a model bake-off (`npm run bakeoff`): the same fictional talent and product through 5 frame models, 6 video models and 4 music models, plus a test assembly in fal's cloud ffmpeg, compared side by side | Done ✅ 2026-10-04: Seedream 4.5, MiniMax H3 Max and ElevenLabs Music v2.5 ([ADR-025](./adr/025-models-chosen-by-bake-off.md)); $4.46 spent | — |
| A1 | **Talent, ad brief, 3 concepts**: the `talent` module and seed script, brand photo uploads, the structured brief with templates and **Polish with AI**, ad plans with hooks, headlines and calls to action, storyboard frames drawn from the talent's and product's photos | On the live link a brief with photos and a cast becomes 3 concepts × 3 frames showing the talent and the product | The talent pack: photos, profile text and a signed release per person, in a local `talent/` folder |
| A1.1 | **Realism and free-trial protection**: Nano Banana Pro frames and Kling v3 Pro video with the talent and product as elements, prompts for footage that looks filmed rather than generated ([ADR-026](./adr/026-realistic-frames-and-video.md)); one free trial per network a day, daily allowances for free work, and Better Auth's anonymous route closed ([ADR-027](./adr/027-one-free-trial-per-network.md)) | Done ✅ 2026-10-05, after a real test ad looked generated and incognito windows minted free credits | — |
| A2 | **Finish the ad**: music and finished-ad asset kinds, assets that wait for their inputs, premium image-to-video, the music bed, text overlays and assembly by fal's cloud ffmpeg, 30 credits on the finished ad | A finished ad plays and downloads from the live link; the money path is tested | — |
| A3 | **Refine and versions**: re-direct a shot, swap the talent, change the music, edit the text; versions kept and playable; the free cap | Each refinement works on the live link; the Playwright journey covers brief → finish → refine → download | — |
| A4 | **Examples and polish**: a gallery of finished ads with their briefs, a UX pass (loading, empty and error states, mobile, keyboard, screen reader), prompts tuned on real outputs | The gallery shows 2–3 real ads; the checklist in `AGENTS.md` §13 holds | Approve the example ads |

## Before: the film build (2026-09-23 to 2026-10-04)

Deadline: **2026-09-24 11:17 UTC**. The brief ([`assignment.md`](./assignment.md)) judges speed, product judgement and UX/UI. The build therefore goes in vertical slices, each ending deployed, so there is always a working live link. Fakes come first (`PROVIDERS=fake`), and real providers arrive in one integration slice.

## Slices

| # | Slice | Budget | Done when | Needs from the user |
|---|---|---|---|---|
| S0 | **Foundations**: spec review, brief, Higgsfield teardown, spec fixes, this plan | 2h | Committed ✅ | — |
| S1 | **Scaffold and deploy**: Next.js 16, TypeScript strict, Tailwind + shadcn with the dark theme tokens, ESLint (boundaries) + Prettier + husky, `env.ts` with fake mode, Drizzle + `pg` client, Vitest + Playwright smoke tests, GitHub Actions CI on Node 24, an app shell on Vercel | 1.5h | The live URL shows the shell; CI is green | Public GitHub repo, Vercel project, Neon project with a `test` branch |
| S2 | **Brief → Board (fakes)**: guest on first submit; projects, director (`PromptComposer`, fake LLM), storyboard frames through production with the fake media provider; the workspace read query + `useProject` polling; Brief page and Board (3 directions × 3 shots), selecting a direction, shot edits with **Redraw frame** | 3h | A brief shows 3 directions with 9 frames on the live link | — |
| S3 | **Produce → Studio (fakes)**: credits ledger and onboarding grants, caps and the kill-switch, `ProduceDirection`, the `asset.generate` polling workflow and the sweep, Studio with shot statuses, the sequential player and downloads; the concurrent-reserve integration test | 3h | Produce → 3 videos → playback on the live link | — |
| S4 | **Real providers**: OpenAI adapter (`gpt-6-sol`) and fal adapter with contract tests, model registry entries (IDs and prices approved by the user: Seedream 4.0 frames, Seedance 1.0 Lite video), Vercel Blob persistence ([ADR-023](./adr/023-vercel-blob-media-storage.md)) with a same-origin download route, frame spend counted by the kill-switch, Inngest Cloud, Upstash, the seeded demo project with real media | 2h | A real brief yields real frames and videos on the live link, within the caps | OpenAI key with a usage limit, fal key with a spend limit and balance, a Vercel Blob store, Inngest app, Upstash database |
| S5 | **Remix and versions**: `remixShot` via `director.rewriteShot`, the redraw-frame toggle, version strip, latest success becomes current, optimistic pending version with rollback | 2h | One shot remixed on the live link; older versions still playable | — |
| S6 | **Accounts**: Google sign-in, the `mergeGuest` process with the "Moving your guest work…" state, cap and out-of-credits states that offer sign-in, magic link built and hidden live | 2h | Guest work survives a Google sign-in on the live link | Google OAuth client with the live redirect URI |
| S7 | **Polish and submit**: a UX pass over every loading, empty and error state, mobile width, keyboard and screen reader; the Playwright journey; README; walkthrough script; submission checklist | 2h | Every item in the checklist below is ticked | Record the walkthrough |

S1–S7 total about 15.5 hours, leaving about 4 hours of buffer before the deadline.

## After S4: talent in ads (superseded)

Superseded on 2026-10-04 by the ad studio above: talent is seeded instead of self-serve, and
there is no sign-in or per-ad approval in the proof of concept
([ADR-024](./adr/024-ad-studio-with-consenting-talent.md)).

Requested after S3: brands cast real talent (actors, influencers, models) from a pool, and the ad is
generated with their likeness and persona. AGENTS.md §1 lists "marketing studio" as out of scope, so
§1 is updated, with an ADR on likeness and consent, before T1 starts.

Order: S4 → S6 (talent need real sign-in) → T1 → T2 → S5 → S7.

| # | Slice | Done when |
|---|---|---|
| T1 | **Talent profiles**: a `talent` module; sign-in required; a profile with persona, photos (Blob), categories accepted or refused and recorded consent; goes live self-serve into a public pool | A signed-in user publishes a profile that appears in the pool |
| T2 | **Casting and approval**: a commercial brief (product or brand, message, audience, call to action, optional product photo) with a cast picker; the Director writes the persona into the shots; frames from Seedream 4.0 edit with the talent's (and product's) photos as references; the ad waits for the talent's approval before the brand can download it | A brand casts a talent, the talent approves, and the brand downloads the ad |

Decisions (2026-10-04):
- **Consent:** the talent approves each ad before the brand can download it.
- **Verification:** profiles go live self-serve, with no review queue. Per-ad approval can't stop an
  impersonator approving their own fakes, so T1 proposes a "these photos are of me" attestation and a
  report-and-takedown path.
- **Voice:** visual only; no dialogue, voice cloning or lip-sync.
- **Likeness:** reference photos (Seedream 4.0 edit takes up to 10); per-talent training only if
  consistency falls short. The edit endpoint's price is checked and approved before use.
- **Payouts:** real payments stay out of scope; v1 records which talent appeared in which ad.

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

Keys go in `.env.local` and the Vercel dashboard, **never in chat**.

1. **S1:** GitHub (an empty public repo), Vercel (import the repo), Neon (a project plus a `test` branch).
2. **S4:** OpenAI (a key with a usage limit), fal (a key with a spend limit and a funded balance), a Vercel Blob store connected to the project (it sets `BLOB_READ_WRITE_TOKEN`), Inngest (the Vercel integration), Upstash Redis.
3. **S6:** a Google OAuth client, with `https://<live-url>/api/auth/callback/google` as the redirect URI.

## Submission checklist (from the brief)

- [ ] The live link opens for somebody who is not signed in
- [ ] The repository is public, with `.agent-logs/` in it, and a final logs commit after the last session
  (agent logging was removed on 2026-10-04 at the user's request; the logs remain in git history)
- [ ] The walkthrough is under five minutes, camera on; the live link and the repository are labelled in the links field

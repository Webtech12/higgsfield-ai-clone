# ADR-024: An ad studio with seeded, consenting talent

- **Status:** Accepted
- **Date:** 2026-10-04
- **Related:** [`AGENTS.md` §1](../../AGENTS.md) · [ADR-007](./007-credit-ledger-reservations.md) · [ADR-011](./011-immutable-versioned-assets.md) · [ADR-016](./016-rate-limits-spend-kill-switch.md) · [ADR-017](./017-storyboard-frame-as-first-frame.md) · [ADR-023](./023-vercel-blob-media-storage.md)

## Context

The assignment deadline has passed and Director continues as a product. The user redirected it from
short films to **ads**: a brand uploads product and scene photos, directs the scene, casts a talent
from a pool, gets 3 suggestions, picks one, refines it and downloads a finished ad. The output has to
be good enough to post on social networks, costs have to stay low, and free use is capped at one ad
and one refinement. Talent sign-up and logins are deferred: five profiles are seeded.

`AGENTS.md` §1 listed "marketing studio" and "stitched MP4 export" as out of scope, and the earlier
talent plan (T1/T2 in [`plan.md`](../plan.md)) assumed self-serve talent with sign-in.

## Decision

1. **Ads only.** The brief becomes a structured ad brief: a template (UGC testimonial, product hero,
   lifestyle, unboxing, before/after), product name and key benefit, audience, key message, call to
   action, moods, scene direction, product and scene photos, one talent and an aspect ratio.
   **Polish with AI** coaches the brief before anything is generated. Existing films stay readable.
2. **Talent is seeded, not self-serve.** Five real people who signed a release, owned by a new
   `talent` module. The release must cover showing their photos in the app, AI-generated ads with
   their likeness, and brands downloading and publishing those ads. We store its date, scope and a
   reference to where the signed copy is kept; the document itself stays offline. Photos and the
   manifest live in a gitignored local folder, and a seed script uploads the photos to Blob.
   Removing someone from the manifest deactivates them, and every generation checks that the talent
   is still active.
3. **One talent per ad**, optional only for the product hero template.
4. **Preview cheap, finish premium.** Three concepts, each with 3 storyboard frames drawn with the
   talent's and the product's photos as references: free, rate-limited and counted by the
   kill-switch (ADR-016). Only the chosen concept is finished: premium 1080p image-to-video from the
   approved frames (ADR-017), a music bed, and the headline and call to action as on-screen text.
5. **The finished ad is assembled in the cloud** by fal's ffmpeg endpoints (join the shots, lay the
   music under them, overlay the text). A local ffmpeg stays rejected (`AGENTS.md` §2). The result
   is one MP4, and each shot stays downloadable.
6. **Every version is kept.** A refinement (re-direct a shot, swap the talent, change the music or
   edit the text) makes a new version of the finished ad with `parent_asset_id` (ADR-011). The latest
   success is current.
7. **Credits sit on the finished ad.** Finishing costs 30 credits and each refinement 10. They are
   reserved on the finished-ad asset, captured when it succeeds and released when it fails (ADR-007),
   so a brand pays only for an ad it gets. A guest's 40 credits buy exactly one ad and one
   refinement. There are no payments.
8. **Models are chosen by a bake-off.** The same inputs go through the leading frame, video and
   music models on fal, and the user compares the results side by side before anything enters the
   registry. ADR-025 records the choice.

## Alternatives considered

- **Keep films and add ads as a second mode:** two briefs and two pipelines to maintain, for a
  proof of concept whose value is the ads.
- **Self-serve talent with sign-in and per-ad approval** (the earlier T1/T2 plan): accounts, review
  flows and identity checks before the ad pipeline has proven itself.
- **Premium video for all three concepts:** about three times the cost before the brand has chosen
  anything.
- **Per-talent model training:** stronger likeness at a higher cost and latency. Reference photos
  come first; training only if likeness falls short.
- **ffmpeg inside our Vercel functions:** heavy binaries and long CPU time, where fal's cloud ffmpeg
  costs about $0.0002 per second of video.

## Consequences

- "Marketing studio" and "stitched MP4 export" move into scope; `AGENTS.md` §1 is rewritten.
- A new `talent` module. `media` gains brand uploads, and `director` and `storyboard` read talent
  through the talent module's public API.
- Assets gain music and finished-ad kinds, and an asset can wait for the assets it is built from.
- Real people's likeness is involved: the consent record, deactivation and keeping their data out of
  the public repository are obligations, not niceties.
- A finished ad costs us roughly $0.60–$2.30 depending on the models, so the $10/day kill-switch
  admits only a handful of free ads a day. The cap is revisited once the models are chosen.
- Brand photos sit in the public Blob store under random keys, like generated media (ADR-023).

## Revisit when

- Talent want to sign themselves up, approve each ad or be paid.
- Payments arrive and credits can be bought.
- Likeness from reference photos falls short and per-talent training is worth its cost.

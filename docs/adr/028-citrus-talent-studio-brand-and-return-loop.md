# ADR-028: Citrus Talent Studio: the brand, the app shell and the way back in

- **Status:** Accepted
- **Date:** 2026-10-06
- **Related:** [ADR-024](./024-ad-studio-with-consenting-talent.md) · [ADR-026](./026-realistic-frames-and-video.md) · [ADR-013](./013-polling-read-model-etag.md)

## Context

The app is being built for Citrus Talent ([citrustalent.com](https://citrustalent.com)), the talent
agency whose roster brands cast. The UI was still the generic "Director" prototype:

- **No brand of its own.** It was a dark theme with no link to Citrus Talent's green, typeface or
  grayscale photography.
- **One page and no navigation.** There was no way back to an earlier ad except its URL.
- **The roster was hidden.** Talent could only be seen inside the brief's cast picker.
- **Long waits ended silently.** Storyboards take about a minute and a render about eight
  ([ADR-026](./026-realistic-frames-and-video.md)). Nothing told a brand who had switched tabs that
  their work was ready.
- **Choosing a concept was hard.** The three concepts were stacked, so they couldn't be compared
  side by side.

## Decision

- **Name and brand: Citrus Talent Studio.**
  - **Colours:** their green `#96CA4A` is the primary colour, and their neon `#D8FF36` is a rare
    accent (selection, work in progress).
  - **Surfaces:** near-black `#0a0a0a` and off-white `#fafaf9`, dark like their homepage.
  - **Light bands:** they use a `.surface-light` scope. Green text there uses `--primary-ink`
    (`#4f7a1c`), because `#96CA4A` on white fails contrast.
  - **Type:** Epilogue (their typeface) for display, Geist for interface text.
  - **Shapes and photos:** pill buttons. Talent photography is grayscale until hovered or cast, as on
    their site.
  - **Logo:** a text wordmark with a "ct" monogram (also the favicon) until their official logo files
    arrive.
- **Motion:**
  - Only custom curves (expo and quart out), and only on `transform`, `opacity` or `clip-path`.
  - Reduced motion turns it off, including looping indicators.
  - **Signature moment:** storyboard frames arrive with a top-to-bottom wipe, like a print coming out
    of the developer.
- **App shell:**
  - A sticky header with the sections (Create, My ads, Talent, Examples) and the credit balance.
  - On phones, a bottom tab bar instead.
  - Both read one `NAV_ITEMS` list.
- **Pages:**
  - **Create (`/`):**
    - First-time visitors open on a talent wall, where clicking a face casts that person in the
      brief below it.
    - Returning visitors see their recent ads first.
    - The brief is a guided two-pane builder with a live checklist.
    - `?talent=<id>` starts a brief with someone cast, and `?from=<adId>` starts one from an earlier
      ad's brief and photos.
  - **My ads (`/ads`):** every ad the viewer made, newest first, refreshing while one is in
    progress, with "Make another" on each.
  - **Talent (`/talent`):** the roster as large portraits, each with the profile, the release on
    file and "Cast in a new ad".
  - **The ad (`/p/[id]`):**
    - The Board compares the three concepts side by side (a carousel on phones), then focuses on the
      chosen one.
    - The Studio leads with a render panel while the ad renders, showing a track per shot, the time
      elapsed and what's left. Assets now carry `createdAt`, so the clock survives a reload.
- **Ready alerts**, so a long wait ends with a signal the brand can't miss:
  - The tab title counts progress ("Rendering (1/3)") and marks arrivals ("✓ Concepts ready").
  - An in-page message, announced by screen readers, marks each arrival. If the tab is in the
    background, the message waits until the brand comes back, and the favicon shows a dot meanwhile.
  - **"Notify me"** sends a desktop browser notification. The browser asks for permission only after
    the click, and it is offered only where the `Notification` constructor works without a service
    worker.
- **The return loop, kept honest:** the alerts are the trigger. Three different concepts each time
  are the varied reward. The ads in My ads and "Make another" build up what the brand has put in.
  There are no streaks or nags, and no notification without consent.

## Alternatives considered

- **A light theme, like their inner marketing pages:** rejected. Their homepage is dark, and video
  and photography read better on dark.
- **Web Push through a service worker** (it also works on phones): it needs push subscriptions
  stored per user, VAPID keys and a worker. Desktop notifications cover the main case for now.
- **Email when an ad is ready:** this needs a verified sending domain, which we don't have yet
  ([ADR-022](./022-no-custom-domain-yet.md)).
- **A model or settings page in the navigation, like Higgsfield's:** rejected. Smart Select chooses
  models ([ADR-024](./024-ad-studio-with-consenting-talent.md)), so the sections follow the brand's
  work instead.

## Consequences

- **Phones get fewer alerts:**
  - There is no system notification.
  - Mobile browsers hide the tab title.
  - Phones rely on the message waiting for their return, and on My ads.
- **A second copy of the favicon:** the dotted favicon (`public/icon-ready.svg`) copies the monogram
  in `src/app/icon.svg`, so the two must change together. The official logo will replace both.
- **Guests' ads are per browser:** "My ads" lists the ads of whoever is signed in. For a guest,
  that's ads made in this browser, and the page says so.
- **The talent wall needs real faces:** it shows the first six people on the roster, so the order
  of the roster matters.

## Revisit when

- The official logo files arrive: replace the wordmark, the monogram and both favicons.
- Sign-in exists (S6): My ads becomes the account's ads across browsers.
- Brands ask for alerts on their phones: add Web Push, or email once a domain is verified.

# ADR-025: Models chosen by a bake-off

- **Status:** Accepted; the frame and video choices are superseded by [ADR-026](./026-realistic-frames-and-video.md) (2026-10-05)
- **Date:** 2026-10-04
- **Related:** [ADR-008](./008-provider-ports-model-registry.md) · [ADR-017](./017-storyboard-frame-as-first-frame.md) · [ADR-024](./024-ad-studio-with-consenting-talent.md) · `scripts/model-bakeoff.mjs`

## Context

ADR-024 asks for ads good enough to post on social networks, at a low cost, with models chosen by
comparing them on the same inputs. fal hosts the leading image, video and music models. The bake-off
(`npm run bakeoff`) put a fictional talent headshot and a product packshot, both generated so that no
real person was involved, through each stage. It cost $4.46 at list prices.

## What was compared

**Frames**: two shots each (a close-up and a lifestyle shot), 9:16, with the talent and product
photos as references.

| Model | Price | Time | Notes |
|---|---|---|---|
| Seedream 4.5 edit | $0.04 | 31–60 s | 1440×2560; face and label kept; the tightest, most commercial close-up |
| Nano Banana 2 edit | $0.08 | ~35 s | Natural; awkward hands in the close-up |
| Nano Banana Pro edit | $0.15 | 39 s – 18 min | The most natural; one frame waited 18 minutes in fal's queue |
| Seedream 5 Pro edit | $0.068 | ~2 min | 1152×2048 |
| FLUX.3 edit | ~$0.057 | 61–74 s | The product small in frame |

**Video**: the same Seedream 4.5 frame and motion prompt for every model, at 1080p. All six returned
1080×1920 H.264.

| Model | Price (one shot) | Time | Notes |
|---|---|---|---|
| Kling v3 Pro, with talent and product elements | $0.70 / 5 s | 453 s | A rack focus onto a crisp label |
| Kling O3 Pro reference-to-video | $0.70 / 5 s | 455 s | Much the same |
| Veo 3.1 Fast | $0.90 / 6 s | 110 s | The bottle left the frame; no 1:1 |
| Wan 3.0 | $0.25 / 5 s | 150 s | The label slightly blown out |
| MiniMax H3 Max | $0.15 / 5 s | 26 s | Followed the direction; crisp label; adds its own sound |
| Gemini Omni Flash | $0.15 / 5 s | 74 s | The label partly hidden mid-shot; no 1:1 |

**Music**: a 15-second instrumental bed.

| Model | Price | Time | Notes |
|---|---|---|---|
| ElevenLabs Music v2.5 | $0.15 | 18 s | Exact length; guaranteed instrumental |
| Lyria 3.5 | $0.10 | 186 s | No length control |
| Stable Audio 2.5 | $0.20 | 19 s | Exact length |
| MiniMax Music 3 | $0.03 | 41 s | Needs lyrics, so instrumental isn't guaranteed |

**Assembly** in fal's cloud ffmpeg:
- `compose` with the shots and the music: 12 fps at about 2 Mbps, after ten minutes. Rejected.
- `compose` with an image track for the text: refused ("Multiple video tracks are not supported").
- A text video laid over the ad with a `screen` blend: a magenta cast over the whole frame, and the
  audio dropped. Rejected.
- An end card held for two seconds (`images-to-video`), joined after the shots by `merge-videos`
  (24 fps, 1080×1920, 27 s), with the music laid under it by `merge-audio-video` (25 s): works. The
  result is about 2.8 Mbps, and it is cut to the length of the audio.

## Decision

The user chose after watching the comparison:

- **Frames:** Seedream 4.5 edit (`fal-ai/bytedance/seedream/v4.5/edit`), and Seedream 4.5
  text-to-image for a brief with no photos, both at 2K in every ratio.
- **Video:** MiniMax H3 Max (`minimax/h3-max/image-to-video`) at 1080P, starting from the storyboard
  frame (ADR-017).
- **Music:** ElevenLabs Music v2.5 (`elevenlabs/music/v2.5`), generated at the finished ad's exact
  length, instrumental. Wired with the finished ad (A2).
- **Assembly** (A2): the shots, then a two-second end card with the headline and call to action
  drawn by `next/og`, joined by `merge-videos` at 24 fps and the ad's resolution, with the music laid
  under the whole cut by `merge-audio-video`.

Seedream 4.0 and Seedance 1.0 Lite stay in the registry as retired: never picked for new work, but
the assets they made still poll, price and retry.

## Consequences

- A brief's nine free storyboard frames cost about $0.36; a finished ad about $0.45 of video, $0.15
  of music and well under a cent of assembly, so about $0.61. The $10 daily kill-switch admits six to
  ten complete free journeys a day, depending on the refinement.
- H3 Max renders a shot in about 30 seconds, and an ad's shots render in parallel.
- H3 Max adds its own soundtrack; the finished ad replaces it with the music bed.
- On-screen text lives on an end card rather than over the shots: fal has no overlay that keeps the
  colours and the audio intact.
- `merge-videos` re-encodes at about 2.8 Mbps, close to what social platforms re-encode uploads to.
  Each shot stays downloadable at its full quality.

## Revisit when

- A newer model beats these on the same script (`npm run bakeoff`).
- A real talent's likeness drifts in motion: Kling v3 Pro with the talent as an element is the
  stronger, slower and dearer option.
- A master sharper than about 3 Mbps is needed, which would mean an encoder of our own.

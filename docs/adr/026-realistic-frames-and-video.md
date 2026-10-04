# ADR-026: Realistic frames and video: Nano Banana Pro and Kling v3 Pro

- **Status:** Accepted
- **Date:** 2026-10-05
- **Related:** [ADR-025](./025-models-chosen-by-bake-off.md) (its frame and video choices are superseded) · [ADR-017](./017-storyboard-frame-as-first-frame.md) · [ADR-024](./024-ad-studio-with-consenting-talent.md) · [ADR-027](./027-one-free-trial-per-network.md)

## Context

The first ads made with real, consenting talent on the live link looked generated: "AI slop", in
the user's words. One UGC toothpaste ad showed four causes:

- Seedream 4.5 garbled the product's real packaging into pseudo-text and invented faces.
- Every frame prompt ended with "photorealistic commercial photography, natural skin texture,
  crisp detail", even for phone-filmed concepts: the glossy look of an AI ad.
- The Director put production notes ("Add headline and CTA in post…") into the style text that
  every frame prompt carries. It also framed UGC shots as arm-out selfies, with warped arms and
  wide-angle faces. And it wrote spoken lines into the motion, which video models render as silent
  talking.
- MiniMax H3 Max animated those frames faithfully, artefacts included.

The user asked for Kling v3 Pro and the most realistic models, accepting the higher price. In the
bake-off (ADR-025), Nano Banana Pro gave the most natural frames: skin, light and label text. Kling
v3 Pro, with the talent and the product as elements, held a likeness and a label in motion.

## Decision

- **Frames:** `fal-ai/nano-banana-pro/edit` with the talent's, product's and scene's photos, and
  `fal-ai/nano-banana-pro` for a brief with none. $0.15 a frame at 2K (1536×2752 for 9:16),
  returned as JPEG so a board of nine stays light.
- **Video:** `fal-ai/kling-video/v3/pro/image-to-video` at $0.14 a second.
  - It starts from the storyboard frame (ADR-017).
  - It takes the talent's current photos and the product's photos as Kling elements, bound in the
    prompt as "@Element1 is the talent. @Element2 is the product."
  - No native audio: the finished ad gets its own music bed, and the talent never speaks.
  - A negative prompt lists the tells of generated footage.
- **Casting at production:** producing checks the talent's casting again and uses their current
  photos, so a talent whose consent has ended is never animated. The production module therefore
  depends on the talent module.
- **Frame prompts** ask for a real, unretouched photograph: true colour, real skin texture, natural
  light, small imperfections; no render, airbrushing or HDR glow. They leave out the words that make
  images look generated: photorealistic, commercial, cinematic, crisp.
- **Video prompts** ask for real footage at natural speed, with steady faces and hands.
- **The Director's instructions:**
  - Each look is described as a cinematographer would note it: camera or phone, lens, light source,
    palette, texture. Production notes never go into it.
  - Settings are real places and real studios, with real light sources.
  - The talent never speaks: no dialogue.
  - Phone-style concepts are filmed by someone else or by a propped phone, with handheld or static
    moves.
- **Polling:** every 5 seconds for up to 20 minutes. A Kling shot took about 7.5 minutes in the
  bake-off, and a Nano Banana Pro frame once queued for 18.
- **Retired:** Seedream 4.5 and H3 Max are never picked for new work. They are still priced, polled
  and retried for the assets they made.
- **Unchanged:** music (ElevenLabs) and assembly.

## Alternatives considered

- **Keep Seedream 4.5 and fix only the prompts:** the cheapest at $0.04 a frame. But it garbled real
  packaging, and the frame sets the realism of the video that starts from it.
- **Nano Banana 2** ($0.08): natural, but hands looked awkward in the bake-off.
- **Cheap storyboards, premium frames only for the chosen concept:** this would break "the frame you
  approve is the first frame" (ADR-017).
- **Veo 3.1 Fast:** the bottle left the frame in the bake-off, and it has no 1:1.

## Consequences

**Cost**
- A brief's nine free frames cost $1.35 (was $0.36).
- A 15-second ad's three shots cost $1.68–2.52 (was about $0.45).
- A typical free journey costs about $3.60: a brief, a redraw and three shots. The $10 daily
  kill-switch therefore admits two or three a day.
- The kill-switch counts a Kling shot at 84 cents, the price of its longest length (6 s), so it errs
  high.
- Credits are unchanged: a shot is still 10.

**Speed and sound**
- A shot takes about 8 minutes to render (H3 Max took 30 seconds), and the Studio says so. Shots
  render side by side.
- Nano Banana Pro sometimes waits minutes in fal's queue, so storyboards can arrive slowly.
- Shots are silent until the finished ad adds its music bed (A2).

## Revisit when

- A cheaper model matches these on the bake-off script, run with real talent.
- Free-tier spend becomes the constraint: draw one storyboard frame per concept until one is chosen,
  then the rest.
- Kling's render time hurts completion, or a likeness drifts in motion despite the elements.

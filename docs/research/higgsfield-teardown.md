# Higgsfield teardown

Explored on 2026-09-23 in a headless browser, signed out. The screenshots are in [`screenshots/`](./screenshots/). Signed-in generation flows were not exercised in this pass (see [Not covered](#not-covered)).

## What Higgsfield is today

An "AI-native creative suite": one front door to 50+ image, video and audio models (Seedance 2.5, Kling 3.0, Veo 3.1, Sora 2, Nano Banana Pro, GPT Image 2, its own Soul models), plus:

- more than a dozen studios, among them Cinema Studio 4.0, Marketing Studio, Lipsync, Photodump, Fashion Factory, UGC Factory, Popcorn storyboards and Canvas
- 250+ camera and VFX presets
- a chat agent (Supercomputer)
- an API, MCP and ChatGPT plugins
- a community gallery and contests

The top navigation has 22 items, and the footer has more than 50 links ([01](./screenshots/01-home.png)).

## Flows observed

| Flow | What it is | Screenshot |
|---|---|---|
| **Video generator** (`/ai/video`) | A left rail holds a preset card ("General · Seedance 2.5", *Change*), references (image, video or audio), a prompt box ("Describe the visual change you want"), model / duration / ratio / resolution chips, and *Generate* showing its credit cost (60, down from 80). An explainer shows three steps: add image → choose preset → get video. One prompt makes one clip. | [02](./screenshots/02-video-generator.png) |
| **Cinema Studio** (`/generate`) | A separate app shell with Projects, My generations, My elements, My favorites, and a "Bring your stories to life" composer. The closest thing to a project workspace. | [03](./screenshots/03-cinema-studio.png) |
| **Popcorn storyboard** (`/storyboard-generator`) | Up to 8 keyframes at a chosen ratio and quality, from an optional reference image plus **a prompt the user writes for each scene**. It then offers a "one-click export to a Sora 2 prompt", which hands the storyboard to a different tool for video. | [04](./screenshots/04-popcorn-storyboard.png) |
| **Supercomputer** (`/supercomputer-intro`) | A chat agent: "The whole team is one agent — from brief to ship". Shot lists, characters, scene boards, "AI employees", memory, connectors, slash-command skills (`/cinematic`), scheduled tasks, and an orchestrator that picks a model for each step. | [05](./screenshots/05-supercomputer.png) |

## What works

- **Breadth and quality.** Every frontier model in one place, and named camera presets make motion approachable.
- **Consistency tools.** Elements, Soul ID and references keep characters stable across generations.
- **Visible cost.** The *Generate* button shows its credit price before you commit.

## What hurts

1. **Model-first navigation.** To start, you must already know which of 50+ models, a dozen studios and 250+ presets fits your idea. The entry point is the tool, not the intent.
2. **A fragmented pipeline.** Storyboarding (Popcorn) ends in "export a prompt" to another tool. Generation happens one clip at a time. Nothing assembles the clips back into a film. Planning, production and review live in different places.
3. **One shot at a time.** The generator has no "film" object. Fixing one shot means re-prompting it from scratch, and versions are a flat history list rather than a lineage you can compare.
4. **Blank-canvas prompting.** "Describe the visual change you want" and per-scene prompts in Popcorn assume the user is already a prompt engineer.
5. **Attention tax.** On first load the generator shows a promo bar, a festival pop-up and a cookie notice at once ([02](./screenshots/02-video-generator.png)).
6. **An unstructured agent.** Supercomputer is powerful, but its output is a conversation, not a board you can compare, edit and produce from.
7. **Slow, client-rendered pages.** Pricing showed only loading skeletons after 15 s in a headless browser.

## What Director does differently

| Higgsfield | Director |
|---|---|
| Pick a model, a studio or a preset first | Write a rough idea; the Director proposes **3 distinct directions** (look, tone, camera language) to compare side by side |
| Storyboard, video and review in separate tools | **One project, one flow:** brief → storyboard → produce → review → remix → playback, with no exports between tools |
| Storyboard frames are exported as a prompt | **The approved storyboard frame is the video's first frame**, so what you approve is what you get |
| Fixing a shot means starting over | **Remix one shot** and keep every version; the rest of the film is untouched |
| The user chooses among 50+ models | **Smart Select** routes to a model; the user sees the cost before committing |
| Promo bars and modals in the creation flow | A calm workspace: nothing competes with the work |

## Deliberately left out

| Left out | Why |
|---|---|
| Model marketplace and model picker | Contradicts the intent-first thesis |
| Cinema Studio clone, Canvas and node workflows | Power-user tools that don't serve a first-time creator's idea-to-film path |
| Soul ID training, Marketing Studio, lipsync, face swap, UGC factories | Separate products with their own users |
| A chat agent like Supercomputer | Director's value is structure: comparable options and a board, not a conversation |
| Payments, collaboration, a video editor, stitched export | Not needed to prove the core loop in 24 hours |

## Not covered

- **Signed-in generation flows** cost credits and need an account, so they were not exercised in this pass. Observations from a signed-in run can be added here.
- **Pricing** is rendered client-side and did not load in the headless browser. The only price data point is the generator's button: 60 credits for a 5-second 1080p Seedance 2.5 clip, discounted from 80.

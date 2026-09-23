# Assignment brief

Copied verbatim from the 8x assignment page on 2026-09-23 at about 14:02 UTC. The page's status lines, and one sentence that the page cuts off mid-word, are kept as shown.

```text
Clone Higgsfield AI
For Software Engineer.

In progress
In progress.
Assignment clock

Time left 21:14:40
Deadline

Due 24 Sept 2026, 11:17 UTC.

A note on this assignment
You’re competing with exceptional talent from around the world, including San Francisco and top universities. This is your opportunity to stand out—bring your best thinking, care, and effort to the assignment.

Brief
Rebuild a live product in 24 hours. Better than the original if you want.

That window is deliberately generous and we do not expect you to use all of it. The clock is tracked, never enforced.

The product
higgsfield.ai

Start by using it. Sign up and go through the flows properly, every one of them, end to end. Take screenshots as you go. Understand the product fully before you write any code.

WE ARE NOT LOOKING FOR JUST A CLONE, WE ARE LOOKING AT HOW YOU APPROACH THE PROBLEM, PLEASE DO NOT JUST COPY THE UI 1:1, WE ARE NOT JUST LOOK

Then rebuild it.

Before you write anything
Run through this so your agent captures its prompts and responses into the repository: 8x agent capture setup

It takes about ten minutes. Do not start building until the capture test passes, and commit the `.agent-logs/` directory as you go rather than in one lump at the end.

What you hand in
A live link. Deployed and open, not a localhost recording.
A public repository. With `.agent-logs/` committed in it.
A walkthrough. Loom or anything similar, five minutes at most, camera on.
Put it in the walkthrough field.

Paste the live link and the repository into the links field, and label each one.

How it is judged
Speed. How much working product you got to in the time.
Product judgement. What you chose to build first, and what you left out.
UX and UI. Whether the thing you shipped is good to use.
Before you send it
The live link opens for somebody who is not signed in as you.
The repository is public, and `.agent-logs/` is in it.
Your camera is on in the walkthrough, and it is under five minutes.
```

## Requirements and where they are met

| Requirement | How it is met | Where |
|---|---|---|
| Use the product end to end, with screenshots, before writing code | A teardown of higgsfield.ai's flows, with screenshots | `docs/research/` (slice 0, before any app code) |
| Not a 1:1 clone; show how you approach the problem | Director reorganises Higgsfield around creative intent (brief → directions → storyboard → shots) instead of model selection, with its own visual language | [`AGENTS.md` §1](../AGENTS.md), `docs/research/` |
| Capture prompts and responses before building; commit `.agent-logs/` as you go | Claude Code hooks log every prompt and final response; logs are staged in every commit | [`CAPTURE-TEST.md`](../CAPTURE-TEST.md), [`.claude/settings.json`](../.claude/settings.json) |
| A live link, deployed and open | Vercel deployment, first deployed early in the build | `docs/plan.md`, slice 1 |
| The live link opens for someone who is not signed in | No login wall. A guest identity is created on the first brief, and a seeded demo project shows finished output straight away | [`AGENTS.md` §5](../AGENTS.md), `docs/plan.md` |
| A public repository with `.agent-logs/` in it | Public GitHub repository; logs committed alongside the code they produced | `docs/plan.md`, slice 1 |
| A walkthrough of five minutes or less, camera on | Recorded by the candidate; a script is drafted in the final slice | `docs/plan.md`, final slice |
| Judged on speed | Vertical slices, the first deploy early, and a lean core: infrastructure ceremony that doesn't protect users or spend is deferred | `docs/plan.md` |
| Judged on product judgement | An explicit out-of-scope list, a cut list with an order, and the teardown's reasoning | [`AGENTS.md` §1](../AGENTS.md), `docs/plan.md`, `docs/research/` |
| Judged on UX and UI | Designed loading, empty, error and success states; a dedicated polish slice | [`docs/frontend.md`](./frontend.md), `docs/plan.md` |

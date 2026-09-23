# ADR-017: The storyboard frame is the video's first frame

- **Status:** Accepted
- **Date:** 2026-09-23
- **Related:** [`architecture.md`](../architecture.md) · [`standards.md`](../standards.md)

## Context

Users approve a storyboard before producing. If videos are generated from text alone, the result can drift from what was approved, and shots drift from each other.

## Decision

Produce every video with image-to-video, using the shot's current approved storyboard frame as the start image. Continuity elements (character, location, style) are injected into every prompt by `PromptComposer`, with a shared seed per direction.

## Alternatives considered

- **Text-to-video from prompts**: Weaker consistency; the storyboard becomes decorative.

## Consequences

What you approve is what you get, and consistency across shots is stronger. Only models that support image-to-video are eligible, which the registry enforces.

## Revisit when

Models with reference-character or multi-shot consistency features become available; add them as new capabilities in the registry.

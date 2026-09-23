# ADR-020: OpenAI as the LLM provider

- **Status:** Accepted
- **Date:** 2026-09-23
- **Related:** amends [ADR-008](./008-provider-ports-model-registry.md)

## Context

The Director turns a brief into a structured plan (3 directions × 3 shots) and rewrites a shot for a remix. The original stack named Anthropic with structured output via forced tool use. The product owner chose OpenAI instead.

## Decision

`OpenAILLMProvider` in `server/integrations/openai/` implements the existing `LLMProvider` port. It uses the Responses API with structured outputs, and the result is validated again with the zod schema from `contracts/`. The default `DIRECTOR_MODEL` is `gpt-6-sol`: current generation, $2 / $10 per million input/output tokens, with structured-output support listed on OpenAI's model page (checked 2026-09-23). `openai` is imported only under `server/integrations/`.

## Alternatives considered

- **Anthropic** (the original choice): also viable behind the same port.
- **`gpt-6-astra`**: the flagship, at roughly 5× the cost per plan, which would eat into the $10/day spend cap.
- **`gpt-5.6-luna`**: the cheapest, but plans risk being creatively flat.

## Consequences

Only one adapter changes. The port and the contract suite keep the provider swappable. Plan cost is a few cents.

## Revisit when

Plan quality disappoints in review, or pricing changes.

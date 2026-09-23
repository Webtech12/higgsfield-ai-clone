# ADR-010: Persist generated media to Cloudflare R2

- **Status:** Accepted; amended by [ADR-022](./022-no-custom-domain-yet.md) (served from r2.dev until a domain exists)
- **Date:** 2026-09-23
- **Related:** [`architecture.md`](../architecture.md) · [`standards.md`](../standards.md)

## Context

Provider output URLs can expire, and video egress costs grow quickly with traffic.

## Decision

The `asset.generate` workflow streams each output from the provider into R2 under `u/{userId}/p/{projectId}/s/{shotId}/{assetId}.{ext}` and serves it through a CDN. Access is via the media module's `ObjectStorage` port.

## Alternatives considered

- **Hot-linking provider URLs**: They expire, and we don't control availability.
- **S3**: Works, but egress fees matter for video; R2 is S3-compatible, so we can switch back.

## Consequences

Durable media, zero egress fees, portable through the S3 API. Adds a copy step to each generation.

## Revisit when

We need private media (signed URLs) or multi-region delivery.

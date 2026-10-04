# ADR-023: Store generated media in Vercel Blob instead of Cloudflare R2

- **Status:** Accepted; supersedes [ADR-010](./010-persist-media-r2.md) and the media half of [ADR-022](./022-no-custom-domain-yet.md)
- **Date:** 2026-09-24
- **Related:** [`architecture.md`](../architecture.md) · [ADR-018](./018-lean-core-for-the-24-hour-build.md)

## Context

Provider outputs must be copied into storage we control as soon as they finish: fal's result URLs
expire. ADR-010 chose Cloudflare R2, served from its r2.dev URL until a domain exists (ADR-022).
Setting R2 up needs a separate Cloudflare account with billing details, an S3 API token and
public-bucket settings. The user asked for a free resource instead, with the deadline close.

## Decision

Store media in **Vercel Blob** (`@vercel/blob`) with public access. The store is created from the
Vercel project's Storage tab, and connecting it injects `BLOB_READ_WRITE_TOKEN` and `BLOB_STORE_ID`.
Either is enough: the app passes the token when there is one, otherwise the store id, which the SDK
pairs with Vercel's OIDC token (so it only works on Vercel). Objects are served from Vercel's CDN at
`*.public.blob.vercel-storage.com`.

- Keys stay `p/{projectId}/{assetId}.{ext}`: random ids keep them unguessable.
- Writes set `allowOverwrite`, so a retried persist step is idempotent.
- Downloads use the Blob `downloadUrl` form (`?download=1`), which answers with
  `Content-Disposition: attachment`. The `download` attribute alone is ignored cross-origin.

## Alternatives considered

- **Cloudflare R2** (ADR-010): zero egress fees, but a separate account with billing details.
- **Supabase Storage**: free tier, but another account and project for a single bucket.
- **Keep fal's URLs**: they expire within the hour.

## Consequences

No extra account: storage lives in the Vercel project that already hosts the app, within the Hobby
plan's free monthly quota. Beyond the quota, uploads fail rather than bill; a failed persist fails
the asset, which refunds its credits. `@vercel/blob` joins the vendor SDKs that only
`server/integrations/**` may import. The `ObjectStorage` port is unchanged, so moving to R2 or S3
later is a new adapter.

## Revisit when

Media traffic outgrows the Hobby quota, or private media (signed URLs) is needed.

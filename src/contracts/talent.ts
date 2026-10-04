import { z } from "zod";

/**
 * The talent roster (ADR-024): real people who signed a release. Only what the app shows is here;
 * where the signed copy is kept stays on the server.
 */
export const TalentPhoto = z.object({ url: z.string(), alt: z.string() });
export type TalentPhoto = z.infer<typeof TalentPhoto>;

export const TalentView = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  tagline: z.string(),
  bio: z.string(),
  tags: z.array(z.string()),
  photos: z.array(TalentPhoto).min(1),
  consent: z.object({
    /** ISO date (YYYY-MM-DD) the release was signed. */
    signedOn: z.string(),
    scope: z.string(),
  }),
});
export type TalentView = z.infer<typeof TalentView>;

/** The talent cast in an ad, as the workspace shows them. */
export const CastView = z.object({
  id: z.string(),
  name: z.string(),
  tagline: z.string(),
  photoUrl: z.string(),
});
export type CastView = z.infer<typeof CastView>;

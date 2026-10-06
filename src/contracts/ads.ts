import { z } from "zod";

import { AdBriefFields, AdTemplateId, ReferenceRole } from "./ad";
import { AspectRatio } from "./brief";
import { ProjectStatus } from "./project";

/** One ad in the viewer's library (My ads, ADR-028): enough for its card, nothing more. */
export const AdSummary = z.object({
  id: z.string(),
  title: z.string(),
  status: ProjectStatus,
  /** ISO timestamp. */
  createdAt: z.string(),
  aspectRatio: AspectRatio,
  /** Null for films made before ads (ADR-024). */
  template: AdTemplateId.nullable(),
  talent: z.object({ name: z.string(), photoUrl: z.string() }).nullable(),
  /** The first storyboard frame of the chosen concept, else of the first concept. */
  coverUrl: z.string().nullable(),
  /** Videos of the chosen concept that are ready, out of its shots. */
  shots: z.object({ ready: z.number().int(), total: z.number().int() }),
});
export type AdSummary = z.infer<typeof AdSummary>;

/**
 * An earlier ad's brief, to start a new one from ("Make another from this brief"). Only ever sent
 * to the ad's owner, so it may carry their own upload ids: the new brief reuses the same photos.
 */
export const BriefDraft = z.object({
  fields: AdBriefFields,
  talentId: z.string().nullable(),
  aspectRatio: AspectRatio,
  photos: z.array(z.object({ uploadId: z.string(), role: ReferenceRole, url: z.string() })),
});
export type BriefDraft = z.infer<typeof BriefDraft>;

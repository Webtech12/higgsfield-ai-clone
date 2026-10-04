import { z } from "zod";

/** GET /api/v1/me: who is looking, and what they can still spend (AGENTS.md §5). */
export const MeView = z.object({
  user: z
    .object({
      id: z.string(),
      isGuest: z.boolean(),
    })
    .nullable(),
  credits: z.number().int(),
  videosToday: z.number().int(),
  videoCap: z.number().int(),
  /**
   * Current prices, read from the routing registry (the one home for costs), so every paid button
   * can show its cost (AGENTS.md §1). Producing, retrying and remixing each make one video per shot.
   */
  prices: z.object({ video: z.number().int() }),
});
export type MeView = z.infer<typeof MeView>;

/**
 * POST /api/v1/session: starts the visitor's session before their first upload, Polish with AI or
 * brief. A new guest is a free trial, one per network a day (ADR-027).
 */
export const SessionResponse = z.object({ isGuest: z.boolean() });
export type SessionResponse = z.infer<typeof SessionResponse>;

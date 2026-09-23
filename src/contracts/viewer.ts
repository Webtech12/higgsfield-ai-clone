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

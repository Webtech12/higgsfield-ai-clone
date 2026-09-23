/** Starter credits (AGENTS.md §1): a guest can finish one full loop; signing in adds more. */
export const STARTER_GRANTS = {
  guest: { amount: 40, key: (userId: string) => `grant:guest:${userId}` },
  signup: { amount: 60, key: (userId: string) => `grant:signup:${userId}` },
} as const;

/** Narrow port for request rate limits: Upstash in production (S4), in-memory on fakes. */
export interface RateLimiter {
  hit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean }>;
}

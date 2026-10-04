import "server-only";

/** The client address behind Vercel's proxy, for per-IP limits on guest creation (ADR-016). */
export const clientIp = (request: Request): string =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

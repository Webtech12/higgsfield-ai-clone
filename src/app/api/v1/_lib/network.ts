import "server-only";

import { networkKeyOf } from "@/server/modules/limits";

/**
 * The network a request comes from, for the per-network free trial and allowances (ADR-027).
 * Vercel overwrites x-forwarded-for with the client's address, so a visitor can't pick their own.
 * Locally Next.js fills it in from the socket, and the E2E tests set it to give each test its own.
 */
export const networkOf = (request: Request): string =>
  networkKeyOf(request.headers.get("x-forwarded-for")?.split(",")[0]);

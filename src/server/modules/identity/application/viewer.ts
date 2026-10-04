import "server-only";

import { getAuth } from "../infrastructure/auth";

export interface Viewer {
  id: string;
  isGuest: boolean;
}

/** The signed-in user or guest behind a request, or null for a visitor with no session. */
export async function getCurrentUser(headers: Headers): Promise<Viewer | null> {
  const session = await getAuth().api.getSession({ headers });
  if (!session) return null;
  return { id: session.user.id, isGuest: session.user.isAnonymous === true };
}

/**
 * Makes a new guest and signs them in (AGENTS.md §5). Only the guestAccess process calls this, after
 * checking the network's free trial (ADR-027): Better Auth's own HTTP route for it is disabled, so
 * this server call is the one way a guest is made. The session cookie is set on the response by
 * Better Auth's nextCookies plugin.
 */
export async function createGuest(headers: Headers): Promise<Viewer> {
  const created = await getAuth().api.signInAnonymous({ headers });
  return { id: created.user.id, isGuest: true };
}

/** Better Auth's HTTP endpoints, built lazily so a build never needs auth configuration. */
export function handleAuthRequest(request: Request): Promise<Response> {
  return getAuth().handler(request);
}

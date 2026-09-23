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
 * Returns the current viewer, creating a guest if there is none. Called only on the first meaningful
 * action (submitting a brief), never on page load, so crawlers don't create rows (AGENTS.md §5).
 * The session cookie is set on the response by Better Auth's nextCookies plugin.
 */
export async function ensureViewer(headers: Headers): Promise<Viewer> {
  const current = await getCurrentUser(headers);
  if (current) return current;
  const created = await getAuth().api.signInAnonymous({ headers });
  return { id: created.user.id, isGuest: true };
}

/** Better Auth's HTTP endpoints, built lazily so a build never needs auth configuration. */
export function handleAuthRequest(request: Request): Promise<Response> {
  return getAuth().handler(request);
}

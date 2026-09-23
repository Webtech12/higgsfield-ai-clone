import "server-only";

import { getCurrentUser, type Viewer } from "@/server/modules/identity";
import { UnauthenticatedError } from "@/server/platform/http/handler";

/** Delivery helper: the viewer behind a request, or 401. Use cases receive the id, never cookies. */
export async function requireViewer(request: Request): Promise<Viewer> {
  const viewer = await getCurrentUser(request.headers);
  if (!viewer) throw new UnauthenticatedError("Sign in or start a project first");
  return viewer;
}

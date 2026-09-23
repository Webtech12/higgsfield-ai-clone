import { ForbiddenError, NotFoundError } from "@/server/platform/errors";

import type { Project } from "../domain/Project";

/**
 * Every write checks ownership (AGENTS.md §5). A project someone else owns reads as "not found", so
 * ids can't be probed. The demo project is readable by anyone but never writable.
 */
export function assertCanEdit(project: Project | null, userId: string): asserts project is Project {
  if (!project?.isOwnedBy(userId)) throw new NotFoundError("Project not found");
  if (project.toSnapshot().isDemo) throw new ForbiddenError("The demo project is read-only");
}

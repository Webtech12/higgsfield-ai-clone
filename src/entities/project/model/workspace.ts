import type { ProjectStatus, WorkspaceView } from "@/contracts/project";

import { productionProgress } from "./production";
import { boardProgress } from "./viewModels";

export type Surface = "board" | "studio";

/**
 * Which surface shows a project: the Board plans and storyboards, the Studio plays the film. The
 * `satisfies` makes a new project status fail to compile until it has a home (AGENTS.md §7).
 */
export const SURFACE_OF_STATUS = {
  planning: "board",
  planned: "board",
  selected: "board",
  failed: "board",
  producing: "studio",
  ready: "studio",
} satisfies Record<ProjectStatus, Surface>;

/** The one line the page's live region announces as work progresses. */
export function progressMessage(view: WorkspaceView): string {
  // The demo is a finished film made by someone else, so "your film" would be wrong.
  if (view.isDemo) return "Made with Director from the brief above. Press play to watch it.";
  return SURFACE_OF_STATUS[view.status] === "studio"
    ? productionProgress(view).message
    : boardProgress(view).message;
}

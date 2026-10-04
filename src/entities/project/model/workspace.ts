import { AD_TEMPLATES } from "@/contracts/ad";
import type { ProjectStatus, WorkspaceView } from "@/contracts/project";
import type { CastView } from "@/contracts/talent";

import { productionProgress } from "./production";
import { boardProgress } from "./viewModels";

export type Surface = "board" | "studio";

/**
 * Which surface shows a project: the Board plans and storyboards, the Studio plays the result. The
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
  // The demo is a finished piece made by someone else, so "your film" would be wrong.
  if (view.isDemo) return "Made with Director from the brief above. Press play to watch it.";
  return SURFACE_OF_STATUS[view.status] === "studio"
    ? productionProgress(view).message
    : boardProgress(view).message;
}

/** What the page header shows about an ad's brief: its format, product, cast and photos. */
export interface AdHeader {
  format: string;
  productName: string;
  cast: CastView | null;
  productPhotos: string[];
}

/** Null for films made before ads (ADR-024). */
export function adHeader(view: WorkspaceView): AdHeader | null {
  if (!view.ad) return null;
  return {
    format: AD_TEMPLATES[view.ad.template].label,
    productName: view.ad.productName,
    cast: view.cast,
    productPhotos: view.references.filter((r) => r.role === "product").map((r) => r.url),
  };
}

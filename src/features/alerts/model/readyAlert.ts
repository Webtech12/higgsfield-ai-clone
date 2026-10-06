import type { WorkspaceView } from "@/contracts/project";
import { frameState, productionProgress, SURFACE_OF_STATUS } from "@/entities/project";
import type { ToastMessage } from "@/shared/ui";

/**
 * Where an ad stands, as far as alerts care (ADR-028): long waits (a minute of storyboards, eight
 * minutes of rendering) should end with a signal the brand can't miss, even in another tab.
 */
export type AdPhase =
  | "planning"
  | "drawing"
  | "concepts-ready"
  | "chosen"
  | "rendering"
  | "ad-ready"
  | "needs-attention";

export function phaseOf(view: WorkspaceView): AdPhase {
  if (view.status === "planning") return "planning";
  if (view.status === "failed") return "needs-attention";
  if (SURFACE_OF_STATUS[view.status] === "studio") {
    const progress = productionProgress(view);
    if (progress.inFlight > 0) return "rendering";
    return progress.failed > 0 ? "needs-attention" : "ad-ready";
  }
  const isDrawing = view.directions
    .flatMap((direction) => direction.shots)
    .some((shot) => {
      const kind = frameState(shot).kind;
      return kind === "waiting" || kind === "drawing";
    });
  if (isDrawing) return "drawing";
  return view.selectedDirectionId ? "chosen" : "concepts-ready";
}

/** What the browser tab says before the page's own title, or null to leave it alone. */
export function titlePrefix(view: WorkspaceView): string | null {
  // The example is someone else's finished ad: nothing is on its way to this viewer.
  if (view.isDemo) return null;
  const phase = phaseOf(view);
  switch (phase) {
    case "planning":
      return "Writing concepts…";
    case "drawing": {
      const frames = view.directions.flatMap((d) => d.shots).map((s) => frameState(s).kind);
      const ready = frames.filter((kind) => kind === "ready").length;
      return `Drawing frames (${String(ready)}/${String(frames.length)})`;
    }
    case "concepts-ready":
      return "✓ Concepts ready";
    case "rendering": {
      const progress = productionProgress(view);
      return `Rendering (${String(progress.ready)}/${String(progress.total)})`;
    }
    case "ad-ready":
      return "✓ Your ad is ready";
    case "needs-attention":
      return "Needs attention";
    case "chosen":
      return null;
  }
}

const WRITING: readonly AdPhase[] = ["planning", "drawing"];

/** Each message, the phase it lands on, and the waits it ends. */
const ARRIVALS: readonly { from: readonly AdPhase[]; to: AdPhase; message: ToastMessage }[] = [
  {
    from: WRITING,
    to: "concepts-ready",
    message: {
      title: "Your three concepts are ready",
      body: "Compare them side by side, then choose one.",
      tone: "success",
    },
  },
  {
    from: ["rendering"],
    to: "ad-ready",
    message: {
      title: "Your ad is ready",
      body: "Press play to watch it, or download each shot.",
      tone: "success",
    },
  },
  {
    from: WRITING,
    to: "needs-attention",
    message: {
      title: "We couldn't write concepts for this brief",
      body: "Try rewording it, or add a little more detail.",
      tone: "danger",
    },
  },
  {
    from: ["rendering"],
    to: "needs-attention",
    message: {
      title: "A shot didn't render",
      body: "Its credits were refunded. Retry it from the shot list.",
      tone: "danger",
    },
  },
];

/**
 * The moment worth a message: work finishing or failing while the brand waited. Opening a page that
 * is already finished says nothing (there was no wait), and neither does choosing a concept.
 */
export function arrivalOf(previous: AdPhase | null, next: AdPhase): ToastMessage | null {
  if (previous === null) return null;
  return ARRIVALS.find((a) => a.to === next && a.from.includes(previous))?.message ?? null;
}

/** Phases where work is under way, so offering to notify the brand makes sense. */
export const isWaiting = (phase: AdPhase): boolean =>
  phase === "planning" || phase === "drawing" || phase === "rendering";

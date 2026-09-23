import type { AssetStatus } from "@/contracts/project";

export type Tone = "muted" | "info" | "success" | "danger";

export interface StatusMeta {
  label: string;
  tone: Tone;
  isTerminal: boolean;
}

/**
 * Asset status → UI treatment. `satisfies` makes the compiler fail if a status is added without one
 * (AGENTS.md §7).
 */
export const ASSET_STATUS_META = {
  queued: { label: "Queued", tone: "muted", isTerminal: false },
  submitted: { label: "Starting", tone: "info", isTerminal: false },
  running: { label: "Drawing", tone: "info", isTerminal: false },
  persisting: { label: "Finishing", tone: "info", isTerminal: false },
  succeeded: { label: "Ready", tone: "success", isTerminal: true },
  failed: { label: "Failed", tone: "danger", isTerminal: true },
} satisfies Record<AssetStatus, StatusMeta>;

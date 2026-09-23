/**
 * Retry and timeout policy for provider jobs, in one place (AGENTS.md §6). Polling replaces webhooks
 * in the lean core (ADR-018), so these bound how long a job may run before it is failed.
 */
export const GENERATION_POLICY = {
  pollInterval: "3s",
  /** 3 s × 120 polls = 6 minutes: comfortably above a slow image-to-video job. */
  maxPolls: 120,
  workflowRetries: 3,
} as const;

/** The once-a-minute sweep that re-sends lost generation events (ADR-018). */
export const SWEEP_POLICY = {
  cron: "* * * * *",
  /** An asset still queued this long after its last update has lost its event. */
  queuedGraceMs: 60_000,
} as const;

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

/**
 * The Director's LLM call. A three-direction plan is one structured response; reasoning models can
 * take a while, so the timeout is generous. The SDK retries transient failures (429, 5xx).
 */
export const LLM_POLICY = {
  timeoutMs: 120_000,
  maxRetries: 2,
} as const;

/** Copying a finished output from the provider into our storage, inside one workflow step. */
export const STORAGE_POLICY = {
  fetchTimeoutMs: 120_000,
} as const;

/** The once-a-minute sweep that re-sends lost generation events (ADR-018). */
export const SWEEP_POLICY = {
  cron: "* * * * *",
  /** An asset still queued this long after its last update has lost its event. */
  queuedGraceMs: 60_000,
} as const;

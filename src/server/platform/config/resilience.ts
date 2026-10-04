/**
 * Retry and timeout policy for provider jobs, in one place (AGENTS.md §6). Polling replaces webhooks
 * in the lean core (ADR-018), so these bound how long a job may run before it is failed.
 */
export const GENERATION_POLICY = {
  pollInterval: "5s",
  /**
   * 5 s × 240 polls = 20 minutes. Kling v3 Pro took about 7.5 minutes per shot in the bake-off, and
   * a Nano Banana Pro frame once waited 18 minutes in fal's queue (ADR-026).
   */
  maxPolls: 240,
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

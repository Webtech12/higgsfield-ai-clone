import { DomainError } from "@/server/platform/errors";

/**
 * What each network gets per day, shared by everyone on it (ADR-027). A trial is a new guest with
 * starter credits. The rest is free to the visitor but not to us: a brief draws nine storyboard
 * frames, a redraw or a frame retry draws one, Polish with AI is one LLM call, and uploads use
 * storage. Videos are paid for with credits, so the trial already bounds them.
 */
export const NETWORK_DAILY_ALLOWANCE = {
  trial: 1,
  brief: 2,
  redraw: 6,
  retry: 6,
  coach: 10,
  upload: 20,
} as const satisfies Record<string, number>;

export type MeteredAction = keyof typeof NETWORK_DAILY_ALLOWANCE;

/** A day: Upstash's fixed windows line up with UTC days, the same days the caps count (usageDay). */
export const ALLOWANCE_WINDOW_SECONDS = 86_400;

export const allowanceKey = (action: MeteredAction, network: string): string =>
  `${action}-net:${network}`;

/** Today's free trial on this network has been used (ADR-027). */
export class TrialLimitReachedError extends DomainError {
  readonly code = "TRIAL_LIMIT_REACHED";
}

/** This network has used today's allowance of some free work (ADR-027). */
export class DailyAllowanceReachedError extends DomainError {
  readonly code = "DAILY_ALLOWANCE_REACHED";
}

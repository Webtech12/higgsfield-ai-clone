import {
  ALLOWANCE_WINDOW_SECONDS,
  allowanceKey,
  NETWORK_DAILY_ALLOWANCE,
  type MeteredAction,
} from "../domain/allowances";
import type { RateLimiter } from "../ports/RateLimiter";

/** Uses one of a network's daily allowance for an action: false once today's is gone (ADR-027). */
export class TakeAllowance {
  constructor(private readonly d: { rateLimiter: RateLimiter }) {}

  async execute(command: { action: MeteredAction; network: string }): Promise<boolean> {
    const { allowed } = await this.d.rateLimiter.hit(
      allowanceKey(command.action, command.network),
      NETWORK_DAILY_ALLOWANCE[command.action],
      ALLOWANCE_WINDOW_SECONDS,
    );
    return allowed;
  }
}

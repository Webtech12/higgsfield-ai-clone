import {
  CoachRequest,
  PlanningRequest,
  type LLMProvider,
  type StructuredRequest,
} from "@/server/modules/director";

import { buildFakeCoach } from "./fakeCoach";
import { buildFakePlan } from "./fakePlan";

/**
 * Deterministic stand-in for the OpenAI provider (PROVIDERS=fake). It honours the same contract as
 * the real one: the result has always passed the request's schema.
 */
export class FakeLLMProvider implements LLMProvider {
  structured<T>(request: StructuredRequest<T>): Promise<T> {
    try {
      return Promise.resolve(request.schema.parse(this.answer(request)));
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private answer(request: StructuredRequest<unknown>): unknown {
    const input: unknown = JSON.parse(request.input);
    switch (request.purpose) {
      case "plan":
        return buildFakePlan(PlanningRequest.parse(input));
      case "coach":
        return buildFakeCoach(CoachRequest.parse(input));
      case "rewrite":
        throw new Error('FakeLLMProvider has no fixture for "rewrite"');
    }
  }
}

import { BriefInput } from "@/contracts/brief";
import type { LLMProvider, StructuredRequest } from "@/server/modules/director";

import { buildFakePlan } from "./fakePlan";

/**
 * Deterministic stand-in for the OpenAI provider (PROVIDERS=fake). It honours the same contract as
 * the real one: the result has always passed the request's schema.
 */
export class FakeLLMProvider implements LLMProvider {
  structured<T>(request: StructuredRequest<T>): Promise<T> {
    if (request.purpose !== "plan") {
      return Promise.reject(new Error(`FakeLLMProvider has no fixture for "${request.purpose}"`));
    }
    const brief = BriefInput.parse(JSON.parse(request.input));
    return Promise.resolve(request.schema.parse(buildFakePlan(brief)));
  }
}

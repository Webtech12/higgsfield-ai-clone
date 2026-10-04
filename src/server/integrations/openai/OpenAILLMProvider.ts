import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import type { LLMProvider, StructuredRequest } from "@/server/modules/director";

/**
 * The Director's LLM: one Responses API call with a structured output built from the request's zod
 * schema (ADR-020). The result is parsed again, because LLM output is a trust boundary.
 */
export class OpenAILLMProvider implements LLMProvider {
  private readonly client: OpenAI;

  constructor(
    private readonly options: {
      apiKey: string;
      model: string;
      timeoutMs: number;
      maxRetries: number;
    },
  ) {
    this.client = new OpenAI({
      apiKey: options.apiKey,
      timeout: options.timeoutMs,
      maxRetries: options.maxRetries,
    });
  }

  async structured<T>(request: StructuredRequest<T>): Promise<T> {
    const response = await this.client.responses.parse({
      model: this.options.model,
      instructions: request.system,
      input: request.input,
      text: { format: zodTextFormat(request.schema, request.purpose) },
    });
    // null when the model refused or stopped early: parsing throws, and the caller's repair retry
    // or failure path takes over.
    return request.schema.parse(response.output_parsed);
  }
}

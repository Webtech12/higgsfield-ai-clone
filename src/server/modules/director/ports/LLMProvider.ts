import type { ZodType } from "zod";

export type LLMPurpose = "plan" | "coach" | "rewrite";

export interface StructuredRequest<T> {
  purpose: LLMPurpose;
  system: string;
  input: string;
  /** The output contract. Implementations must return a value that passed this schema. */
  schema: ZodType<T>;
}

/** Narrow port: one structured call. Implemented by OpenAI and a fake (ADR-020). */
export interface LLMProvider {
  structured<T>(request: StructuredRequest<T>): Promise<T>;
}

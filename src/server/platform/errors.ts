import type { ErrorCode } from "@/contracts/errors";

/**
 * The one inheritance hierarchy allowed in the codebase (AGENTS.md §6). Each subclass carries a stable
 * code that maps 1:1 to the API envelope (platform/http/errorMap.ts) and to UI copy.
 */
export abstract class DomainError extends Error {
  abstract readonly code: ErrorCode;
  readonly retryable: boolean = false;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends DomainError {
  readonly code = "NOT_FOUND";
}

export class ForbiddenError extends DomainError {
  readonly code = "FORBIDDEN";
}

export class ValidationError extends DomainError {
  readonly code = "VALIDATION_FAILED";
}

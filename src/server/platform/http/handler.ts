import "server-only";

import { ZodError, type ZodType } from "zod";

import type { ApiErrorBody, ErrorCode } from "@/contracts/errors";

import { DomainError } from "../errors";
import { ERROR_STATUS } from "./errorMap";

export class UnauthenticatedError extends DomainError {
  readonly code = "UNAUTHENTICATED";
}

function errorResponse(code: ErrorCode, message: string, retryable = false): Response {
  const body: ApiErrorBody = { error: { code, message, retryable } };
  return Response.json(body, { status: ERROR_STATUS[code] });
}

/**
 * Wraps a route handler: domain errors become the stable error envelope, invalid input becomes 400,
 * anything else is logged and returned as a generic 500 without internals.
 */
export function handle<TContext>(
  handler: (request: Request, context: TContext) => Promise<Response>,
): (request: Request, context: TContext) => Promise<Response> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof DomainError)
        return errorResponse(error.code, error.message, error.retryable);
      if (error instanceof ZodError)
        return errorResponse("VALIDATION_FAILED", "The request is invalid");
      console.error("Unhandled error in route handler", error);
      return errorResponse("INTERNAL", "Something went wrong on our side", true);
    }
  };
}

export async function readJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ZodError([]);
  }
  return schema.parse(body);
}

export const accepted = (body: unknown) => Response.json(body, { status: 202 });

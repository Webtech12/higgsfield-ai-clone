import type { ZodType } from "zod";

import { ApiErrorBody, type ErrorCode } from "@/contracts/errors";

/** The only frontend class (AGENTS.md §7): a typed, stable error from our API. */
export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly status: number,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "ApiError";
  }

  static async fromResponse(response: Response): Promise<ApiError> {
    const parsed = ApiErrorBody.safeParse(await response.json().catch(() => null));
    if (parsed.success) {
      const { code, message, retryable } = parsed.data.error;
      return new ApiError(code, message, response.status, retryable);
    }
    return new ApiError("INTERNAL", "Unexpected response", response.status, response.status >= 500);
  }
}

/** The one home of the API's base path, for requests and for plain links (e.g. downloads). */
export const apiUrl = (path: string): string => `/api/v1${path}`;

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  headers?: Record<string, string>;
}

/** Calls /api/v1 and parses the response with its contract: responses are parsed, not cast. */
export async function apiRequest<T>(
  path: string,
  schema: ZodType<T>,
  { method = "GET", body, headers = {} }: RequestOptions = {},
): Promise<T> {
  const response = await fetch(apiUrl(path), {
    method,
    headers: { ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) throw await ApiError.fromResponse(response);
  return schema.parse(await response.json());
}

/** A GET that honours ETags: returns null on 304 so the caller keeps what it has. */
export async function apiGetIfChanged<T>(
  path: string,
  schema: ZodType<T>,
  etag: string | null,
): Promise<{ data: T; etag: string | null } | null> {
  const response = await fetch(apiUrl(path), {
    headers: etag ? { "If-None-Match": etag } : {},
    cache: "no-store",
  });
  if (response.status === 304) return null;
  if (!response.ok) throw await ApiError.fromResponse(response);
  return { data: schema.parse(await response.json()), etag: response.headers.get("ETag") };
}

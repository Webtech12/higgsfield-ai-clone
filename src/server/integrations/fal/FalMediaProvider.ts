import { ApiError, createFalClient, type FalClient, type Result } from "@fal-ai/client";

import type { GenerationRequest, MediaProvider, ProviderStatus } from "@/server/modules/production";

import { FAL_ENDPOINTS, type FalEndpoint } from "./endpoints";

/**
 * fal's queue API behind the MediaProvider port (ADR-008). The generation workflow polls `status`;
 * there are no webhooks in the lean core (ADR-018).
 */
export class FalMediaProvider implements MediaProvider {
  private readonly client: FalClient;

  constructor(apiKey: string) {
    this.client = createFalClient({ credentials: apiKey });
  }

  async submit(request: GenerationRequest): Promise<{ requestId: string }> {
    try {
      const { request_id } = await this.client.queue.submit(request.model, {
        input: endpointFor(request.model).input(request),
      });
      return { requestId: request_id };
    } catch (error) {
      throw describe(error);
    }
  }

  async status(requestId: string, model: string): Promise<ProviderStatus> {
    const status = await this.client.queue.status(model, { requestId }).catch((error: unknown) => {
      throw describe(error);
    });
    if (status.status === "IN_QUEUE") return { state: "queued" };
    if (status.status === "IN_PROGRESS") return { state: "running" };
    try {
      const result: Result<unknown> = await this.client.queue.result(model, { requestId });
      return { state: "completed", outputUrl: endpointFor(model).outputUrl(result.data) };
    } catch (error) {
      // A finished request whose result is a client error has failed for good (invalid input, the
      // safety checker). Server and network errors propagate, so the workflow step retries.
      if (error instanceof ApiError && error.status < 500) {
        return { state: "failed", reason: describe(error).message };
      }
      throw describe(error);
    }
  }
}

function endpointFor(model: string): FalEndpoint {
  const endpoint = FAL_ENDPOINTS[model];
  if (!endpoint) throw new Error(`No fal endpoint mapping for ${model}`);
  return endpoint;
}

/** fal's ApiError has an empty message; the reason is in the body's `detail`. */
function describe(error: unknown): Error {
  if (!(error instanceof ApiError))
    return error instanceof Error ? error : new Error(String(error));
  const body: unknown = error.body;
  const detail =
    typeof body === "object" && body !== null && "detail" in body ? body.detail : error.message;
  const reason = typeof detail === "string" ? detail : JSON.stringify(detail);
  return new Error(`fal ${String(error.status)}: ${reason}`.slice(0, 500), { cause: error });
}

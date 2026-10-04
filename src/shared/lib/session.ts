import { SessionResponse } from "@/contracts/viewer";

import { apiRequest } from "./apiClient";

let started: Promise<unknown> | undefined;

/**
 * Starts the visitor's session before their first upload, Polish with AI or brief (AGENTS.md §5).
 * Concurrent callers share one request, so picking several photos at once makes one guest rather
 * than one per photo, whose uploads the surviving session couldn't use. A refusal (today's free
 * trial on this network is used, ADR-027) reaches every caller and isn't remembered, so a later
 * action asks again.
 */
export async function ensureSession(): Promise<void> {
  started ??= apiRequest("/session", SessionResponse, { method: "POST" });
  try {
    await started;
  } catch (error) {
    started = undefined;
    throw error;
  }
}

import { z } from "zod";

import { AspectRatio } from "@/contracts/brief";
import { AssetKind } from "@/contracts/project";
import type { GenerationRequest, MediaProvider, ProviderStatus } from "@/server/modules/production";

import { hashString } from "../hash";

/** Everything the fake needs is encoded in the request id, so it works across server instances. */
const FakeTicket = z.object({
  kind: AssetKind,
  seed: z.string(),
  ratio: AspectRatio,
  title: z.string(),
  subtitle: z.string(),
  createdAt: z.number(),
  fail: z.boolean(),
});
type FakeTicket = z.infer<typeof FakeTicket>;

const LATENCY_MS = { frame: [2500, 5000], video: [9000, 14000] } as const;

/** A prompt containing this marker fails, so failure states can be exercised end to end. */
export const FAKE_FAILURE_MARKER = "FAIL_ME";

const encode = (ticket: FakeTicket) => Buffer.from(JSON.stringify(ticket)).toString("base64url");

/** The ticket behind a request id we issued, or null for anything else. */
function decode(requestId: string): FakeTicket | null {
  try {
    const json: unknown = JSON.parse(Buffer.from(requestId, "base64url").toString("utf8"));
    return FakeTicket.safeParse(json).data ?? null;
  } catch {
    return null;
  }
}

export class FakeMediaProvider implements MediaProvider {
  constructor(private readonly now: () => number = Date.now) {}

  submit(request: GenerationRequest): Promise<{ requestId: string }> {
    const ticket: FakeTicket = {
      kind: request.kind,
      seed: request.seed,
      ratio: request.aspectRatio,
      title: request.label?.title ?? "Untitled shot",
      subtitle: request.label?.subtitle ?? "",
      createdAt: this.now(),
      fail: request.prompt.includes(FAKE_FAILURE_MARKER),
    };
    return Promise.resolve({ requestId: encode(ticket) });
  }

  status(requestId: string): Promise<ProviderStatus> {
    const ticket = decode(requestId);
    // Like a real provider's 404: an id we never issued is an error, never a status.
    if (!ticket) return Promise.reject(new Error("The fake provider never issued this request"));
    const [min, max] = LATENCY_MS[ticket.kind];
    const latency = min + (hashString(ticket.seed) % (max - min));
    const elapsed = this.now() - ticket.createdAt;

    if (elapsed < latency / 3) return Promise.resolve({ state: "queued" });
    if (elapsed < latency) return Promise.resolve({ state: "running" });
    if (ticket.fail)
      return Promise.resolve({ state: "failed", reason: "The fake provider was asked to fail" });
    return Promise.resolve({ state: "completed", outputUrl: fakeMediaUrl(ticket) });
  }
}

/** Pre-recorded placeholder clips per aspect ratio (scripts/record-fake-clips.mjs). */
const CLIPS_PER_RATIO = 3;

function fakeMediaUrl(ticket: FakeTicket): string {
  if (ticket.kind === "video") {
    const clip = (hashString(ticket.seed) % CLIPS_PER_RATIO) + 1;
    return `/fake-media/clip-${ticket.ratio.replace(":", "x")}-${String(clip)}.webm`;
  }
  const params = new URLSearchParams({
    seed: ticket.seed,
    ratio: ticket.ratio,
    title: ticket.title,
    subtitle: ticket.subtitle,
  });
  return `/api/fake-media/frame?${params.toString()}`;
}

import { describe, expect, it } from "vitest";

import type { MediaProvider, ProviderStatus } from "@/server/modules/production";

/** What the shared suite needs to drive one MediaProvider implementation (AGENTS.md §8). */
export interface MediaProviderHarness {
  provider: MediaProvider;
  frameModel: string;
  videoModel: string;
  /** A frame model that draws from reference photos, and photos it can fetch; skipped if absent. */
  references?: { model: string; imageUrls: string[] };
  /** Lets time pass between polls: a fake clock jumps, a real provider really waits. */
  wait(ms: number): Promise<void>;
  pollMs: number;
  maxPolls: number;
  timeoutMs: number;
}

async function untilSettled(
  harness: MediaProviderHarness,
  requestId: string,
  model: string,
): Promise<ProviderStatus> {
  for (let poll = 0; poll < harness.maxPolls; poll++) {
    const status = await harness.provider.status(requestId, model);
    if (status.state === "completed" || status.state === "failed") return status;
    await harness.wait(harness.pollMs);
  }
  throw new Error(`Still running after ${String(harness.maxPolls)} polls`);
}

const isUrl = (value: string) => {
  // Fakes serve media from the app itself, so a path relative to it counts.
  expect(() => new URL(value, "http://localhost")).not.toThrow();
  return value.length > 0;
};

/** The behaviour every MediaProvider must share, so the workflow can treat them alike. */
export function describeMediaProviderContract(
  name: string,
  makeHarness: () => MediaProviderHarness,
) {
  describe(`MediaProvider contract: ${name}`, () => {
    const harness = makeHarness();
    let frameUrl: string | undefined;
    let referenceFrameUrl: string | undefined;

    it(
      "renders a storyboard frame: submit, poll, then a URL",
      async () => {
        const { requestId } = await harness.provider.submit({
          kind: "frame",
          model: harness.frameModel,
          prompt: "A lighthouse at dusk, film still, cinematic widescreen composition, no text",
          aspectRatio: "16:9",
          seed: "contract-frame",
          label: { title: "Contract", subtitle: "Frame" },
        });
        expect(requestId).not.toBe("");

        const status = await untilSettled(harness, requestId, harness.frameModel);
        expect(status.state).toBe("completed");
        if (status.state === "completed") {
          expect(isUrl(status.outputUrl)).toBe(true);
          frameUrl = status.outputUrl;
        }
      },
      harness.timeoutMs,
    );

    it.skipIf(!harness.references)(
      "draws a frame from reference photos (ADR-024)",
      async () => {
        if (!harness.references) return;
        const { model, imageUrls } = harness.references;
        const { requestId } = await harness.provider.submit({
          kind: "frame",
          model,
          prompt:
            "Close-up: the person in image 1 holds the product from image 2 beside her cheek and smiles, soft window light, vertical composition, no added text",
          aspectRatio: "9:16",
          seed: "contract-reference-frame",
          referenceImageUrls: imageUrls,
          label: { title: "Contract", subtitle: "References" },
        });

        const status = await untilSettled(harness, requestId, model);
        expect(status.state).toBe("completed");
        if (status.state === "completed") {
          expect(isUrl(status.outputUrl)).toBe(true);
          referenceFrameUrl = status.outputUrl;
        }
      },
      harness.timeoutMs,
    );

    it(
      "animates a frame into a video that starts from it (ADR-017), keeping its people and objects (ADR-026)",
      async () => {
        const start = referenceFrameUrl ?? frameUrl;
        if (!start) throw new Error("A frame test must pass first: its frame is the input");
        // With reference photos, the person and the product also travel as video elements.
        const [person, product] = harness.references?.imageUrls ?? [];
        const elements =
          referenceFrameUrl && person && product
            ? [
                { role: "talent" as const, imageUrls: [person] },
                { role: "product" as const, imageUrls: [product] },
              ]
            : undefined;
        const { requestId } = await harness.provider.submit({
          kind: "video",
          model: harness.videoModel,
          prompt: elements
            ? "The talent slowly turns the product toward the camera and smiles. Camera: slow dolly in"
            : "Slow dolly in toward the lighthouse as the beam sweeps across the sea",
          negativePrompt: "CGI, plastic skin, morphing, garbled label text",
          aspectRatio: elements ? "9:16" : "16:9",
          seed: "contract-video",
          imageUrl: start,
          durationS: 4,
          ...(elements ? { elements } : {}),
          label: { title: "Contract", subtitle: "Video" },
        });

        const status = await untilSettled(harness, requestId, harness.videoModel);
        expect(status.state).toBe("completed");
        if (status.state === "completed") expect(isUrl(status.outputUrl)).toBe(true);
      },
      harness.timeoutMs,
    );

    it("fails loudly for a request it never issued", async () => {
      await expect(
        harness.provider.status("not-a-request-we-issued", harness.frameModel),
      ).rejects.toThrow();
    });
  });
}

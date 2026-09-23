import { describe, expect, it } from "vitest";

import { Asset, IllegalTransitionError } from "./Asset";

const newFrame = () =>
  Asset.create({
    id: "ast_1",
    projectId: "prj_1",
    shotId: "sht_1",
    kind: "frame",
    version: 1,
    model: "fake/frame",
    prompt: "a lighthouse at dusk",
    sourceUrl: null,
    costCredits: 0,
    meta: { aspectRatio: "16:9", label: { title: "Set-up", subtitle: "Quiet" } },
  });

describe("Asset", () => {
  it("starts queued and walks the happy path to succeeded", () => {
    const asset = newFrame();

    asset.markSubmitted("req_1");
    asset.markRunning();
    asset.markPersisting();
    asset.markSucceeded("https://media.example/ast_1.png");

    expect(asset.status).toBe("succeeded");
    expect(asset.isTerminal).toBe(true);
    expect(asset.toSnapshot().url).toBe("https://media.example/ast_1.png");
  });

  it("allows the fast path from submitted straight to persisting", () => {
    const asset = newFrame();
    asset.markSubmitted("req_1");

    asset.markPersisting();

    expect(asset.status).toBe("persisting");
  });

  it("rejects illegal transitions", () => {
    const asset = newFrame();

    expect(() => {
      asset.markSucceeded("x");
    }).toThrow(IllegalTransitionError);
  });

  it("never leaves succeeded", () => {
    const asset = newFrame();
    asset.markSubmitted("req_1");
    asset.markPersisting();
    asset.markSucceeded("x");

    expect(() => {
      asset.markFailed("late failure");
    }).toThrow(IllegalTransitionError);
  });

  it("can be retried after failing, clearing the error", () => {
    const asset = newFrame();
    asset.markFailed("provider timeout");

    asset.requeueForRetry();

    expect(asset.status).toBe("queued");
    expect(asset.toSnapshot().error).toBeNull();
    expect(asset.attempt).toBe(2);
  });

  it("remembers the persisted status for guarded updates", () => {
    const asset = Asset.rehydrate({ ...newFrame().toSnapshot(), status: "submitted" });

    asset.markRunning();

    expect(asset.persistedStatus).toBe("submitted");
    expect(asset.status).toBe("running");
  });
});

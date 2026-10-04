import { describe, expect, it, vi } from "vitest";

import type { Viewer } from "@/server/modules/identity";
import { TrialLimitReachedError } from "@/server/modules/limits";

import { createGuestAccess } from "./guestAccess";

const headers = new Headers();

function setup(options: { current?: Viewer } = {}) {
  const usedTrials = new Set<string>();
  const assertTrialAvailable = vi.fn((network: string) => {
    if (usedTrials.has(network)) {
      return Promise.reject(new TrialLimitReachedError("used"));
    }
    usedTrials.add(network);
    return Promise.resolve();
  });
  let made = 0;
  const createGuest = vi.fn(() => {
    made += 1;
    return Promise.resolve({ id: `usr_guest_${String(made)}`, isGuest: true });
  });
  const access = createGuestAccess({
    currentUser: () => Promise.resolve(options.current ?? null),
    createGuest,
    limits: { assertTrialAvailable },
  });
  return { access, createGuest, assertTrialAvailable };
}

describe("guestAccess.ensureViewer", () => {
  it("returns the visitor's own session without using a trial", async () => {
    const { access, createGuest, assertTrialAvailable } = setup({
      current: { id: "usr_1", isGuest: true },
    });

    await expect(access.ensureViewer(headers, "v4:203.0.113.7")).resolves.toEqual({
      id: "usr_1",
      isGuest: true,
    });
    expect(assertTrialAvailable).not.toHaveBeenCalled();
    expect(createGuest).not.toHaveBeenCalled();
  });

  it("makes a guest while the network still has today's trial", async () => {
    const { access, createGuest } = setup();

    await expect(access.ensureViewer(headers, "v4:203.0.113.7")).resolves.toMatchObject({
      isGuest: true,
    });
    expect(createGuest).toHaveBeenCalledOnce();
  });

  it("refuses a second guest on the same network, and makes none", async () => {
    const { access, createGuest } = setup();
    await access.ensureViewer(headers, "v4:203.0.113.7");

    await expect(access.ensureViewer(headers, "v4:203.0.113.7")).rejects.toBeInstanceOf(
      TrialLimitReachedError,
    );
    expect(createGuest).toHaveBeenCalledOnce();
    await expect(access.ensureViewer(headers, "v6:2001:db8:0:1")).resolves.toMatchObject({
      isGuest: true,
    });
  });
});

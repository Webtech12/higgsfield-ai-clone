import { describe, expect, it } from "vitest";

import type { MeView } from "@/contracts/viewer";

import { spendCheck } from "./spend";

const me = (overrides: Partial<MeView> = {}): MeView => ({
  user: { id: "usr_1", isGuest: true },
  credits: 40,
  videosToday: 0,
  videoCap: 6,
  prices: { video: 10 },
  ...overrides,
});

describe("spendCheck", () => {
  it("waits for the balance before judging", () => {
    expect(spendCheck(undefined, 3)).toEqual({ kind: "loading" });
  });

  it("prices videos with the server's price and allows what the balance covers", () => {
    expect(spendCheck(me(), 3)).toEqual({ kind: "ok", cost: 30, balance: 40 });
    expect(spendCheck(me({ prices: { video: 12 } }), 3)).toMatchObject({ cost: 36 });
  });

  it("explains a short balance with the numbers", () => {
    expect(spendCheck(me({ credits: 10 }), 3)).toEqual({
      kind: "blocked",
      cost: 30,
      reason: "credits",
      message: "This needs 30 credits and you have 10.",
    });
  });

  it("checks today's cap before credits, like the server", () => {
    expect(spendCheck(me({ credits: 0, videosToday: 5 }), 3)).toMatchObject({
      kind: "blocked",
      reason: "cap",
      message: "You've made 5 of today's 6 videos. Come back tomorrow for more.",
    });
  });

  it("allows spending exactly up to the cap and the balance", () => {
    expect(spendCheck(me({ credits: 30, videosToday: 3 }), 3).kind).toBe("ok");
  });
});

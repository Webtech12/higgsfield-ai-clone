import type { MeView } from "@/contracts/viewer";

/**
 * Whether the viewer can pay for some videos, checked before the click so a paid button can say why
 * it's disabled. The server checks again inside the reserve transaction; this is only for UX.
 */
export type SpendCheck =
  | { kind: "loading" }
  | { kind: "ok"; cost: number; balance: number }
  | { kind: "blocked"; cost: number; reason: "cap" | "credits"; message: string };

export function spendCheck(me: MeView | undefined, videos: number): SpendCheck {
  if (!me) return { kind: "loading" };
  const cost = videos * me.prices.video;

  // Same order as the server (caps are recorded before credits are reserved).
  if (me.videosToday + videos > me.videoCap) {
    return {
      kind: "blocked",
      cost,
      reason: "cap",
      message: `You've made ${me.videosToday} of today's ${me.videoCap} videos. Come back tomorrow for more.`,
    };
  }
  if (me.credits < cost) {
    return {
      kind: "blocked",
      cost,
      reason: "credits",
      message: `This needs ${cost} credits and you have ${me.credits}.`,
    };
  }
  return { kind: "ok", cost, balance: me.credits };
}

import { describe, expect, it } from "vitest";

import { INITIAL_PLAYER, playerReducer, type PlayerState } from "./usePlayer";

const allReady = [true, true, true];

describe("playerReducer", () => {
  it("plays the film from the shot on screen", () => {
    const state = playerReducer(
      { ...INITIAL_PLAYER, index: 1 },
      { type: "play", playable: allReady },
    );

    expect(state).toEqual({ index: 1, isPlaying: true, hasEnded: false });
  });

  it("advances to the next shot when a clip ends, and stops after the last", () => {
    const playing: PlayerState = { index: 0, isPlaying: true, hasEnded: false };
    const second = playerReducer(playing, { type: "clipEnded", playable: allReady });
    const last = playerReducer({ ...second, index: 2 }, { type: "clipEnded", playable: allReady });

    expect(second).toEqual({ index: 1, isPlaying: true, hasEnded: false });
    expect(last).toEqual({ index: 2, isPlaying: false, hasEnded: true });
  });

  it("skips shots that are still rendering", () => {
    const playing: PlayerState = { index: 0, isPlaying: true, hasEnded: false };

    expect(playerReducer(playing, { type: "clipEnded", playable: [true, false, true] }).index).toBe(
      2,
    );
    expect(
      playerReducer(INITIAL_PLAYER, { type: "play", playable: [false, true, true] }).index,
    ).toBe(1);
  });

  it("starts again from the top after the end", () => {
    const ended: PlayerState = { index: 2, isPlaying: false, hasEnded: true };

    expect(playerReducer(ended, { type: "play", playable: allReady })).toEqual({
      index: 0,
      isPlaying: true,
      hasEnded: false,
    });
  });

  it("wraps to an earlier ready shot when nothing after the current one is ready", () => {
    const state = playerReducer(
      { ...INITIAL_PLAYER, index: 2 },
      {
        type: "play",
        playable: [true, false, false],
      },
    );

    expect(state.index).toBe(0);
  });

  it("does nothing on play when no shot is ready", () => {
    expect(playerReducer(INITIAL_PLAYER, { type: "play", playable: [false, false] })).toBe(
      INITIAL_PLAYER,
    );
  });

  it("keeps playing when jumping to a ready shot, and pauses on one that isn't ready", () => {
    const playing: PlayerState = { index: 0, isPlaying: true, hasEnded: false };

    expect(playerReducer(playing, { type: "select", index: 2, playable: allReady })).toMatchObject({
      index: 2,
      isPlaying: true,
    });
    expect(
      playerReducer(playing, { type: "select", index: 1, playable: [true, false, true] }),
    ).toMatchObject({ index: 1, isPlaying: false });
  });
});

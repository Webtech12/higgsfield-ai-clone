import { describe, expect, it } from "vitest";

import { TalentUnavailableError, type TalentRecord } from "../domain/casting";
import { GetCasting } from "./GetCasting";

const record = (overrides: Partial<TalentRecord> = {}): TalentRecord => ({
  id: "tal_1",
  name: "Ava",
  tagline: "Skincare creator",
  bio: "Calm, honest reviews.",
  tags: ["beauty", "wellness"],
  photos: [1, 2, 3, 4].map((n) => ({ url: `https://cdn/ava-${String(n)}.jpg`, alt: "Ava" })),
  isActive: true,
  ...overrides,
});

const castingFor = (stored: TalentRecord | null) =>
  new GetCasting({ talent: { find: () => Promise.resolve(stored) } }).execute("tal_1");

describe("GetCasting", () => {
  it("returns the persona and at most three reference photos", async () => {
    const casting = await castingFor(record());
    expect(casting.persona).toBe(
      "Skincare creator. Calm, honest reviews. Known for: beauty, wellness.",
    );
    expect(casting.photoUrls).toEqual([
      "https://cdn/ava-1.jpg",
      "https://cdn/ava-2.jpg",
      "https://cdn/ava-3.jpg",
    ]);
  });

  it("refuses a talent whose consent ended", async () => {
    await expect(castingFor(record({ isActive: false }))).rejects.toBeInstanceOf(
      TalentUnavailableError,
    );
  });

  it("refuses a talent who isn't on the roster", async () => {
    await expect(castingFor(null)).rejects.toBeInstanceOf(TalentUnavailableError);
  });
});

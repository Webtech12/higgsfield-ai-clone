import { describe, expect, it } from "vitest";

import type { TalentView } from "@/contracts/talent";

import { toTalentCard } from "./talentCard";

const talent: TalentView = {
  id: "tal_1",
  slug: "ava-moreno",
  name: "Ava Moreno",
  tagline: "Skincare and wellness creator",
  bio: "Calm, honest reviews.",
  tags: ["beauty", "wellness", "routines", "travel"],
  photos: [
    { url: "https://cdn/ava-1.jpg", alt: "Ava, head and shoulders" },
    { url: "https://cdn/ava-2.jpg", alt: "Ava, full body" },
  ],
  consent: { signedOn: "2026-10-04", scope: "Ads made with Director" },
};

describe("toTalentCard", () => {
  it("keeps three tags and leads with the first photo", () => {
    const card = toTalentCard(talent);

    expect(card.tags).toEqual(["beauty", "wellness", "routines"]);
    expect(card.cover.url).toBe("https://cdn/ava-1.jpg");
    expect(card.photos).toHaveLength(2);
  });

  it("prints the release date the same way on the server and in the browser", () => {
    expect(toTalentCard(talent).consentLine).toBe("Release signed 4 Oct 2026");
  });
});

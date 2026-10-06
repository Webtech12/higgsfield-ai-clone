import { describe, expect, it } from "vitest";

import type { AdSummary } from "@/contracts/ads";

import { hasAdsInProgress, timeAgo, toAdCard } from "./adCard";

const now = new Date("2026-10-06T12:00:00Z");

const ad = (overrides: Partial<AdSummary> = {}): AdSummary => ({
  id: "prj_1",
  title: "LUMA Vitamin C Serum",
  status: "planned",
  createdAt: "2026-10-06T11:55:00Z",
  aspectRatio: "9:16",
  template: "ugc-testimonial",
  talent: { name: "Ava Moreno", photoUrl: "https://cdn/ava.jpg" },
  coverUrl: "https://cdn/frame.jpg",
  shots: { ready: 0, total: 0 },
  ...overrides,
});

describe("toAdCard", () => {
  it("names the status in the brand's words and links to the ad", () => {
    const card = toAdCard(ad(), now);

    expect(card.status).toMatchObject({ label: "Pick a concept", isInProgress: false });
    expect(card.href).toBe("/p/prj_1");
    expect(card.format).toBe("UGC testimonial");
    expect(card.madeAgo).toBe("5 min ago");
  });

  it("counts finished shots only while the ad renders", () => {
    expect(toAdCard(ad({ status: "producing", shots: { ready: 2, total: 3 } }), now).detail).toBe(
      "2 of 3 shots ready",
    );
    expect(toAdCard(ad({ status: "ready", shots: { ready: 3, total: 3 } }), now).detail).toBeNull();
  });

  it("offers to start a new brief from an ad, but not from a film made before ads", () => {
    expect(toAdCard(ad(), now).makeAnotherHref).toBe("/?from=prj_1");
    expect(toAdCard(ad({ template: null }), now).makeAnotherHref).toBeNull();
  });
});

describe("timeAgo", () => {
  it("reads like a person would say it", () => {
    expect(timeAgo("2026-10-06T11:59:30Z", now)).toBe("Just now");
    expect(timeAgo("2026-10-06T09:00:00Z", now)).toBe("3 h ago");
    expect(timeAgo("2026-10-05T10:00:00Z", now)).toBe("Yesterday");
    expect(timeAgo("2026-10-03T12:00:00Z", now)).toBe("3 days ago");
    expect(timeAgo("2026-09-20T12:00:00Z", now)).toBe("20 Sept");
  });
});

describe("hasAdsInProgress", () => {
  it("is true while any ad is being written or rendered", () => {
    expect(hasAdsInProgress([ad({ status: "ready" }), ad({ status: "producing" })])).toBe(true);
    expect(hasAdsInProgress([ad({ status: "ready" }), ad({ status: "failed" })])).toBe(false);
  });
});

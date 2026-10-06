import { AD_TEMPLATES } from "@/contracts/ad";
import type { AdSummary } from "@/contracts/ads";
import type { AspectRatio } from "@/contracts/brief";
import type { ProjectStatus } from "@/contracts/project";

import type { Tone } from "./statusMeta";

/** Where an ad stands, in the words of its card (My ads, ADR-028). */
export interface AdStatusMeta {
  label: string;
  tone: Tone;
  /** Work is under way, so the library refreshes until it settles. */
  isInProgress: boolean;
}

/** Exhaustive by type: a new project status fails to compile until it has a card label. */
export const AD_STATUS_META = {
  planning: { label: "Writing concepts", tone: "info", isInProgress: true },
  planned: { label: "Pick a concept", tone: "success", isInProgress: false },
  selected: { label: "Ready to produce", tone: "muted", isInProgress: false },
  producing: { label: "Rendering", tone: "info", isInProgress: true },
  ready: { label: "Ready", tone: "success", isInProgress: false },
  failed: { label: "Needs attention", tone: "danger", isInProgress: false },
} satisfies Record<ProjectStatus, AdStatusMeta>;

export interface AdCardModel {
  id: string;
  href: string;
  title: string;
  status: AdStatusMeta;
  format: string | null;
  talent: { name: string; photoUrl: string } | null;
  coverUrl: string | null;
  aspectRatio: AspectRatio;
  /** "5 min ago", "Yesterday", "4 Oct" */
  madeAgo: string;
  /** "2 of 3 shots ready" while rendering; null otherwise. */
  detail: string | null;
  /** Ads can start a new brief; films made before ads have no brief to reuse. */
  makeAnotherHref: string | null;
}

const DAY_MONTH = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** A short, human "when", relative to `now` (the server's clock, so the page and refreshes agree). */
export function timeAgo(iso: string, now: Date): string {
  const elapsed = now.getTime() - new Date(iso).getTime();
  if (elapsed < MINUTE) return "Just now";
  if (elapsed < HOUR) return `${String(Math.floor(elapsed / MINUTE))} min ago`;
  if (elapsed < DAY) return `${String(Math.floor(elapsed / HOUR))} h ago`;
  if (elapsed < 2 * DAY) return "Yesterday";
  if (elapsed < 7 * DAY) return `${String(Math.floor(elapsed / DAY))} days ago`;
  return DAY_MONTH.format(new Date(iso));
}

export function toAdCard(ad: AdSummary, now: Date): AdCardModel {
  const status = AD_STATUS_META[ad.status];
  return {
    id: ad.id,
    href: `/p/${encodeURIComponent(ad.id)}`,
    title: ad.title,
    status,
    format: ad.template ? AD_TEMPLATES[ad.template].label : null,
    talent: ad.talent,
    coverUrl: ad.coverUrl,
    aspectRatio: ad.aspectRatio,
    madeAgo: timeAgo(ad.createdAt, now),
    detail:
      ad.status === "producing" && ad.shots.total > 0
        ? `${String(ad.shots.ready)} of ${String(ad.shots.total)} shots ready`
        : null,
    makeAnotherHref: ad.template ? `/?from=${encodeURIComponent(ad.id)}` : null,
  };
}

/** True while any ad is still being made, so the library keeps itself current. */
export const hasAdsInProgress = (ads: readonly AdSummary[]): boolean =>
  ads.some((ad) => AD_STATUS_META[ad.status].isInProgress);

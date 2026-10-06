import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

import { hasAdsInProgress, toAdCard } from "@/entities/project";
import { AdsGrid, EmptyAds, LiveRefresh } from "@/features/ads";
import { getModules } from "@/server/container";
import { getCurrentUser } from "@/server/modules/identity";
import { listViewerAds } from "@/server/queries";
import { Button, PageHeader } from "@/shared/ui";

export const metadata: Metadata = { title: "My ads" };

// Per request: the library changes as ads are made, and it's the viewer's own.
export const dynamic = "force-dynamic";

/** My ads (ADR-028): everything the viewer has made, newest first, current while work is running. */
export default async function MyAdsPage() {
  const viewer = await getCurrentUser(await headers());
  const ads = viewer ? await listViewerAds(getModules().db, viewer.id) : [];
  const now = new Date();
  const cards = ads.map((ad) => toAdCard(ad, now));

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-12 pb-24 sm:px-6 sm:pt-16">
      <PageHeader
        eyebrow="Your library"
        title="My ads"
        lede={
          cards.length > 0
            ? `${String(cards.length)} ${cards.length === 1 ? "ad" : "ads"} made in this browser.`
            : "Ads you make in this browser appear here."
        }
        actions={
          cards.length > 0 ? (
            <Button asChild size="lg">
              <Link href="/">
                <Plus aria-hidden /> New ad
              </Link>
            </Button>
          ) : null
        }
      />
      <div className="mt-12">{cards.length > 0 ? <AdsGrid ads={cards} /> : <EmptyAds />}</div>
      <LiveRefresh isActive={hasAdsInProgress(ads)} />
    </main>
  );
}

import { headers } from "next/headers";

import { toAdCard } from "@/entities/project";
import { toTalentCard, type TalentCardModel } from "@/entities/talent";
import { RecentAds } from "@/features/ads";
import { AdBriefComposer, HowItWorks, type BriefStart } from "@/features/brief";
import { getModules } from "@/server/container";
import { getCurrentUser } from "@/server/modules/identity";
import { getBriefDraft, listTalent, listViewerAds } from "@/server/queries";
import type { Reader } from "@/server/platform/db";

// The roster and the viewer's ads are read per request: both change without a deploy.
export const dynamic = "force-dynamic";

/** How many recent ads a returning visitor sees above the brief. */
const RECENT_ADS = 4;

/**
 * Create (ADR-028). A first visit opens on the talent wall; a returning visitor sees their recent ads
 * first. `?talent=<id>` arrives from the Talent page with someone already cast, and `?from=<adId>`
 * from "Make another" with an earlier ad's brief and photos.
 */
export default async function CreatePage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const { db } = getModules();
  const viewer = await getCurrentUser(await headers());
  const roster = (await listTalent(db)).map(toTalentCard);
  const recent = viewer ? await listViewerAds(db, viewer.id, { limit: RECENT_ADS }) : [];
  const start = await briefStart(db, viewer?.id ?? null, params, roster);
  const now = new Date();
  const isReturning = recent.length > 0;

  return (
    <main className="flex w-full flex-1 flex-col pb-36 lg:pb-24">
      <AdBriefComposer
        roster={roster}
        start={start}
        variant={isReturning ? "returning" : "first"}
        aboveBrief={
          isReturning ? <RecentAds ads={recent.map((ad) => toAdCard(ad, now))} /> : undefined
        }
      />
      {isReturning ? null : (
        <div className="mt-24">
          <HowItWorks />
        </div>
      )}
    </main>
  );
}

const single = (value: string | string[] | undefined): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;

/** Where the brief starts: an earlier ad (owner only), a talent from the roster, or blank. */
async function briefStart(
  db: Reader,
  viewerId: string | null,
  params: Record<string, string | string[] | undefined>,
  roster: TalentCardModel[],
): Promise<BriefStart | null> {
  // Only someone still on the roster can be cast: a talent whose consent ended drops out.
  const castable = (talentId: string | null) =>
    talentId && roster.some((talent) => talent.id === talentId) ? talentId : null;

  const from = single(params.from);
  if (from && viewerId) {
    const draft = await getBriefDraft(db, viewerId, from);
    if (draft) {
      return {
        values: {
          ...draft.fields,
          talentId: castable(draft.talentId),
          aspectRatio: draft.aspectRatio,
        },
        photos: draft.photos,
      };
    }
  }
  const talentId = castable(single(params.talent));
  return talentId ? { values: { talentId }, photos: [] } : null;
}

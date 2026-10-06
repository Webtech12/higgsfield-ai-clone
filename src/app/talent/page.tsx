import type { Metadata } from "next";

import { toTalentCard } from "@/entities/talent";
import { EmptyRoster, RosterGrid } from "@/features/talent";
import { getModules } from "@/server/container";
import { listTalent } from "@/server/queries";
import { PageHeader } from "@/shared/ui";

export const metadata: Metadata = { title: "Talent" };

// The roster changes without a deploy (a new release signed, a talent deactivated).
export const dynamic = "force-dynamic";

/** The talent roster (ADR-028): everyone who can be cast, each with their release on file. */
export default async function TalentPage() {
  const roster = (await listTalent(getModules().db)).map(toTalentCard);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-12 pb-24 sm:px-6 sm:pt-16">
      <PageHeader
        eyebrow="The roster"
        title="Talent"
        lede="Real people, each with a signed release to appear in AI-made ads. Pick one to star in your next ad."
      />
      <div className="mt-12">
        {roster.length > 0 ? <RosterGrid roster={roster} /> : <EmptyRoster />}
      </div>
    </main>
  );
}

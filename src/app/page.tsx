import Link from "next/link";

import { toTalentCard } from "@/entities/talent";
import { AdBriefComposer, HowItWorks } from "@/features/brief";
import { getModules } from "@/server/container";
import { listTalent } from "@/server/queries";

// The roster is read per request: talent can join or leave without a deploy (ADR-024).
export const dynamic = "force-dynamic";

export default async function BriefPage() {
  const roster = (await listTalent(getModules().db)).map(toTalentCard);
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-16 pb-24 sm:px-6 sm:pt-24">
      <section aria-labelledby="brief-heading" className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-medium tracking-widest text-primary uppercase">
          Your AI creative director for ads
        </p>
        <h1
          id="brief-heading"
          className="mt-4 font-display text-5xl leading-[1.05] tracking-tight text-balance sm:text-7xl"
        >
          Real talent. Your product. <em className="text-muted-foreground">A finished ad.</em>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-muted-foreground">
          Brief it in a few lines and cast a real creator. You get three concepts with storyboards,
          and the one you choose becomes an ad ready to post.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Want to see the result first?{" "}
          <Link
            href="/demo"
            className="text-foreground underline underline-offset-4 hover:text-primary focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            Watch an example
          </Link>
        </p>
      </section>

      <div className="mt-12">
        <AdBriefComposer roster={roster} />
      </div>

      <HowItWorks />
    </main>
  );
}

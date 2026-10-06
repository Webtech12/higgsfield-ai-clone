import { ArrowRight, Maximize2, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { TalentProfile, type TalentCardModel } from "@/entities/talent";
import { Button, FadeInImage } from "@/shared/ui";

/**
 * The whole roster as large portraits (ADR-028), grayscale until hovered as on Citrus Talent's own
 * site. A portrait opens the full profile; "Cast in a new ad" starts a brief with that person cast.
 */
export function RosterGrid({ roster }: { roster: TalentCardModel[] }) {
  return (
    <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {roster.map((talent, index) => (
        <li
          key={talent.id}
          className="animate-rise"
          style={{ animationDelay: `${String(200 + index * 80)}ms` }}
        >
          <RosterCard talent={talent} />
        </li>
      ))}
    </ul>
  );
}

/** In the grid it's an outline, so a wall of portraits isn't a wall of green; the profile's is solid. */
function CastLink({ talent, isPrimary }: { talent: TalentCardModel; isPrimary: boolean }) {
  return (
    <Button asChild size="lg" variant={isPrimary ? "primary" : "outline"}>
      <Link href={talent.castHref}>
        Cast in a new ad <ArrowRight aria-hidden />
      </Link>
    </Button>
  );
}

function RosterCard({ talent }: { talent: TalentCardModel }) {
  return (
    <article aria-labelledby={`talent-${talent.id}`} className="flex flex-col">
      <TalentProfile
        talent={talent}
        action={<CastLink talent={talent} isPrimary />}
        trigger={
          <button
            type="button"
            aria-label={`View ${talent.name}’s profile`}
            className="group/portrait relative block aspect-[3/4] w-full overflow-hidden rounded-2xl bg-muted outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            <FadeInImage
              src={talent.cover.url}
              alt={talent.cover.alt}
              className="absolute inset-0 size-full object-cover grayscale transition-[filter,transform,opacity] duration-1000 ease-out-expo group-hover/portrait:scale-[1.03] group-hover/portrait:grayscale-0 group-focus-visible/portrait:grayscale-0"
            />
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
              <Maximize2 className="size-3.5" aria-hidden /> View profile
            </span>
          </button>
        }
      />
      <h2
        id={`talent-${talent.id}`}
        className="mt-5 font-display text-2xl font-semibold tracking-[-0.02em]"
      >
        {talent.name}
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{talent.tagline}</p>
      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5 text-primary" aria-hidden /> {talent.consentLine}
      </p>
      <div className="mt-5">
        <CastLink talent={talent} isPrimary={false} />
      </div>
    </article>
  );
}

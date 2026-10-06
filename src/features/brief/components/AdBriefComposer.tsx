"use client";

import type { ReactNode } from "react";
import { useWatch } from "react-hook-form";

import type { TalentCardModel } from "@/entities/talent";
import { PageHeader } from "@/shared/ui";

import { useAdBrief, type BriefStart } from "../hooks/useAdBrief";
import { BriefMobileBar } from "./BriefMobileBar";
import { BriefSteps } from "./BriefSteps";
import { BriefSummary } from "./BriefSummary";
import { TalentWall } from "./TalentWall";

/** Smooth for most people, instant for anyone who asked their system for less motion. */
function scrollToBrief() {
  const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document
    .getElementById("brief")
    ?.scrollIntoView({ behavior: isReduced ? "auto" : "smooth", block: "start" });
}

/**
 * The Create page's brief (ADR-024, ADR-028). A first visit opens on the talent wall, where clicking
 * a face casts them; a returning visitor gets straight to work under their recent ads. On wide
 * screens "Your ad" sits beside the form with the Create button always in view; on phones a bar
 * pinned above the tab bar holds it.
 */
export function AdBriefComposer({
  roster,
  start,
  variant,
  aboveBrief,
}: {
  roster: TalentCardModel[];
  start: BriefStart | null;
  variant: "first" | "returning";
  /** What a returning visitor sees before the brief, e.g. their recent ads. */
  aboveBrief?: ReactNode;
}) {
  const brief = useAdBrief(roster, start);
  const castId = useWatch({ control: brief.form.control, name: "talentId" });

  return (
    <form
      className="flex flex-col"
      onSubmit={(event) => void brief.submit(event)}
      noValidate
      aria-label="Ad brief"
    >
      {variant === "first" ? (
        <TalentWall
          roster={roster}
          castId={castId}
          onCast={(talentId) => {
            brief.form.setValue("talentId", talentId, {
              shouldValidate: brief.form.formState.isSubmitted,
            });
            scrollToBrief();
          }}
        />
      ) : null}
      <div className="mx-auto w-full max-w-7xl px-4 pt-12 sm:px-6 sm:pt-16">
        {variant === "returning" ? (
          <>
            <PageHeader
              eyebrow="New ad"
              title="What are we making?"
              lede="Brief it, cast it, and get three storyboarded concepts in about a minute."
            />
            {aboveBrief ? <div className="mt-12">{aboveBrief}</div> : null}
          </>
        ) : null}
        <div
          id="brief"
          className="grid scroll-mt-24 gap-12 pt-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14 xl:grid-cols-[minmax(0,1fr)_24rem]"
        >
          <BriefSteps brief={brief} roster={roster} />
          <aside className="hidden lg:block">
            <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto">
              <BriefSummary
                form={brief.form}
                photos={brief.photos}
                cast={brief.cast}
                progress={brief.progress}
                status={brief.status}
                isBusy={brief.isBusy}
              />
            </div>
          </aside>
        </div>
      </div>
      <BriefMobileBar
        progress={brief.progress}
        status={brief.status}
        isBusy={brief.isBusy}
        isUploading={brief.photos.isUploading}
      />
    </form>
  );
}

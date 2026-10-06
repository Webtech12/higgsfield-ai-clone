"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Controller, useWatch } from "react-hook-form";

import type { TalentCardModel } from "@/entities/talent";

import type { AdBrief } from "../hooks/useAdBrief";
import { needsTalent } from "../model/briefForm";
import { BriefCoach } from "./BriefCoach";
import { BriefSection } from "./BriefSection";
import { BriefTextField } from "./BriefTextField";
import { MoodPicker } from "./MoodPicker";
import { MoreDirection } from "./MoreDirection";
import { PhotoUploader } from "./PhotoUploader";
import { RatioPicker } from "./RatioPicker";
import { TalentPicker } from "./TalentPicker";
import { TemplatePicker } from "./TemplatePicker";

/**
 * The brief's steps, in the order a brand thinks about an ad: the format, the product, who's in it.
 * Everything optional is folded under "More direction", and Polish with AI reviews the lot.
 */
export function BriefSteps({ brief, roster }: { brief: AdBrief; roster: TalentCardModel[] }) {
  const { form, photos } = brief;
  const template = useWatch({ control: form.control, name: "template" });

  return (
    <div className="flex min-w-0 flex-col gap-16">
      <BriefSection
        number={1}
        title="Format"
        lede="A proven ad structure: each beat becomes a shot."
      >
        <Controller
          control={form.control}
          name="template"
          render={({ field }) => <TemplatePicker value={field.value} onChange={field.onChange} />}
        />
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            <span className="font-medium">Where it runs</span>{" "}
            <span className="text-muted-foreground">sets the shape of every frame.</span>
          </p>
          <Controller
            control={form.control}
            name="aspectRatio"
            render={({ field }) => <RatioPicker value={field.value} onChange={field.onChange} />}
          />
        </div>
      </BriefSection>

      <BriefSection
        number={2}
        title="Product"
        lede="What you're selling, and the one reason to want it."
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,19rem)]">
          <div className="flex flex-col gap-5">
            <BriefTextField form={form} name="productName" />
            <BriefTextField form={form} name="benefit" multiline />
          </div>
          <PhotoUploader
            kind="product"
            photos={photos}
            label="Product photos"
            hint="Clear, well-lit shots of the product itself: every frame copies its shape and label from these."
          />
        </div>
      </BriefSection>

      <BriefSection
        number={3}
        id="cast"
        title="Cast"
        lede="Real creators who signed a release to appear in AI-made ads."
        aside={
          <Link
            href="/talent"
            className="mt-1 inline-flex shrink-0 items-center gap-1 rounded-full text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            Full roster <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        }
      >
        <Controller
          control={form.control}
          name="talentId"
          render={({ field }) => (
            <TalentPicker
              roster={roster}
              value={field.value}
              onChange={field.onChange}
              allowNone={!needsTalent({ template })}
              error={form.formState.errors.talentId?.message}
            />
          )}
        />
      </BriefSection>

      <MoreDirection isOpen={brief.isMoreOpen} onToggle={brief.toggleMore}>
        <div className="grid gap-5 sm:grid-cols-2">
          <BriefTextField form={form} name="audience" optional />
          <BriefTextField form={form} name="message" optional />
          <BriefTextField form={form} name="cta" optional />
          <Controller
            control={form.control}
            name="moods"
            render={({ field }) => <MoodPicker value={field.value} onChange={field.onChange} />}
          />
        </div>
        <div className="mt-8 grid gap-6 border-t border-border pt-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,19rem)]">
          <BriefTextField form={form} name="sceneDirection" multiline optional />
          <PhotoUploader
            kind="scene"
            photos={photos}
            label="Scene photos"
            hint="Optional: a photo of the place you have in mind."
          />
        </div>
      </MoreDirection>

      <BriefCoach form={form} onApplied={brief.onCoachApplied} />
    </div>
  );
}

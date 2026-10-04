"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { AdBriefInput } from "@/contracts/ad";
import { CreateProjectResponse } from "@/contracts/project";
import type { TalentCardModel } from "@/entities/talent";
import { useRefreshMe } from "@/entities/viewer";
import { apiRequest } from "@/shared/lib/apiClient";
import { errorMessage } from "@/shared/lib/apiErrors";

import { usePhotoUploads } from "../hooks/usePhotoUploads";
import { BRIEF_DEFAULTS, needsTalent } from "../model/briefForm";
import { BriefCoach } from "./BriefCoach";
import { BriefSection } from "./BriefSection";
import { BriefSubmitBar } from "./BriefSubmitBar";
import { BriefTextField } from "./BriefTextField";
import { MoodPicker } from "./MoodPicker";
import { PhotoUploader } from "./PhotoUploader";
import { TalentPicker } from "./TalentPicker";
import { TemplatePicker } from "./TemplatePicker";

/**
 * The ad brief (ADR-024): format, product and photos, message, cast and scene, with Polish with AI
 * before it's sent. Submitting creates the ad (and a guest, on first use) and opens its board.
 */
export function AdBriefComposer({ roster }: { roster: TalentCardModel[] }) {
  const router = useRouter();
  const refreshMe = useRefreshMe();
  const form = useForm<AdBriefInput>({
    resolver: zodResolver(AdBriefInput),
    defaultValues: BRIEF_DEFAULTS,
  });
  // The first upload can be what creates the guest: show their starter credits.
  const photos = usePhotoUploads({ onUploaded: () => void refreshMe() });
  const template = useWatch({ control: form.control, name: "template" });

  // Uploads finish outside the form; keep its references in step so they're validated and sent.
  useEffect(() => {
    form.setValue("references", photos.references);
  }, [form, photos.references]);

  const create = useMutation({
    mutationFn: (brief: AdBriefInput) =>
      apiRequest("/projects", CreateProjectResponse, { method: "POST", body: brief }),
    onSuccess: ({ projectId }) => {
      void refreshMe();
      router.push(`/p/${projectId}`);
    },
  });
  const submit = form.handleSubmit((brief) => {
    create.mutate(brief);
  });

  return (
    <form
      className="flex flex-col gap-8 rounded-xl border border-border bg-card/60 p-4 shadow-2xl shadow-black/40 backdrop-blur sm:p-6"
      onSubmit={(event) => void submit(event)}
      noValidate
    >
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
      </BriefSection>

      <BriefSection
        number={2}
        title="Product"
        lede="What you're selling, and the one reason to want it."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
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

      <BriefSection number={3} title="Message" lede="Who it's for, and what they should do next.">
        <div className="grid gap-4 sm:grid-cols-2">
          <BriefTextField form={form} name="audience" optional />
          <BriefTextField form={form} name="message" optional />
          <BriefTextField form={form} name="cta" optional />
          <Controller
            control={form.control}
            name="moods"
            render={({ field }) => <MoodPicker value={field.value} onChange={field.onChange} />}
          />
        </div>
      </BriefSection>

      <BriefSection
        number={4}
        title="Cast"
        lede="Real creators who signed a release to appear in AI-made ads."
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

      <BriefSection
        number={5}
        title="Scene"
        lede="Optional: where it happens. The Director fills in the rest."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <BriefTextField form={form} name="sceneDirection" multiline optional />
          <PhotoUploader
            kind="scene"
            photos={photos}
            label="Scene photos"
            hint="Optional: a photo of the place you have in mind."
          />
        </div>
      </BriefSection>

      <BriefCoach form={form} />

      <BriefSubmitBar
        form={form}
        isBusy={create.isPending || create.isSuccess}
        isUploading={photos.isUploading}
        error={create.isError ? errorMessage(create.error) : null}
      />
    </form>
  );
}

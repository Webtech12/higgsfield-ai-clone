"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";

import { AdBriefInput, type AdTextField } from "@/contracts/ad";
import { CreateProjectResponse } from "@/contracts/project";
import type { TalentCardModel } from "@/entities/talent";
import { useRefreshMe } from "@/entities/viewer";
import { apiRequest } from "@/shared/lib/apiClient";
import { errorMessage } from "@/shared/lib/apiErrors";
import { ensureSession } from "@/shared/lib/session";

import { BRIEF_DEFAULTS } from "../model/briefForm";
import { briefProgress, submitStatus } from "../model/briefProgress";
import { usePhotoUploads, type PhotoUploads, type StartPhoto } from "./usePhotoUploads";

/** Where a brief starts: blank, with a talent cast from the roster, or from an earlier ad (ADR-028). */
export interface BriefStart {
  values: Partial<AdBriefInput>;
  photos: StartPhoto[];
}

/** The optional fields folded under "More direction": it opens when one has a value or an error. */
const MORE_DIRECTION: ReadonlySet<string> = new Set([
  "audience",
  "message",
  "cta",
  "moods",
  "sceneDirection",
]);

const startsWithMoreDirection = (start: BriefStart | null): boolean =>
  Boolean(
    start &&
    (Object.entries(start.values).some(
      ([key, value]) =>
        MORE_DIRECTION.has(key) && (Array.isArray(value) ? value.length > 0 : Boolean(value)),
    ) ||
      start.photos.some((photo) => photo.role === "scene")),
  );

/** Whether "More direction" is open: it opens itself for a value, an error or a fresh suggestion. */
function useMoreDirection(start: BriefStart | null) {
  const [isOpen, setOpen] = useState(() => startsWithMoreDirection(start));
  return {
    isMoreOpen: isOpen,
    toggleMore: () => {
      setOpen((open) => !open);
    },
    /** Open if any of these fields lives in the folded section. */
    openFor: (fields: readonly string[]) => {
      if (fields.some((field) => MORE_DIRECTION.has(field))) setOpen(true);
    },
  };
}

/** What's left to do, from the fields that decide it; and who's cast, for the summary. */
function useBriefProgress(form: UseFormReturn<AdBriefInput>, photos: PhotoUploads) {
  const [template, productName, benefit, talentId] = useWatch({
    control: form.control,
    name: ["template", "productName", "benefit", "talentId"],
  });
  const productPhotos = photos.itemsFor("product").filter((i) => i.status === "ready").length;
  return [
    talentId,
    briefProgress({ template, productName, benefit, talentId, productPhotos }),
  ] as const;
}

/** Creates the ad, then opens its board. The session starts first, shared with any uploads. */
function useCreateAd() {
  const router = useRouter();
  const refreshMe = useRefreshMe();
  return useMutation({
    mutationFn: async (brief: AdBriefInput) => {
      await ensureSession();
      return apiRequest("/projects", CreateProjectResponse, { method: "POST", body: brief });
    },
    onSuccess: ({ projectId }) => {
      void refreshMe();
      router.push(`/p/${projectId}`);
    },
  });
}

/** The brief's whole state: the form, its photos, what's left to do, and sending it. */
export function useAdBrief(roster: TalentCardModel[], start: BriefStart | null) {
  const refreshMe = useRefreshMe();
  const form = useForm<AdBriefInput>({
    resolver: zodResolver(AdBriefInput),
    defaultValues: { ...BRIEF_DEFAULTS, ...start?.values },
  });
  // The first upload can be what creates the guest: show their starter credits.
  const photos = usePhotoUploads({
    onUploaded: () => void refreshMe(),
    initial: start?.photos ?? [],
  });
  const more = useMoreDirection(start);
  const create = useCreateAd();

  // Uploads finish outside the form; keep its references in step so they're validated and sent.
  useEffect(() => {
    form.setValue("references", photos.references);
  }, [form, photos.references]);

  const [talentId, progress] = useBriefProgress(form, photos);

  return {
    form,
    photos,
    isBusy: create.isPending || create.isSuccess,
    submit: form.handleSubmit(
      (brief) => {
        create.mutate(brief);
      },
      (errors) => {
        more.openFor(Object.keys(errors));
      },
    ),
    progress,
    status: submitStatus({
      error: create.isError ? errorMessage(create.error) : null,
      isUploading: photos.isUploading,
      isSubmittedInvalid: form.formState.isSubmitted && !form.formState.isValid,
    }),
    cast: roster.find((talent) => talent.id === talentId) ?? null,
    isMoreOpen: more.isMoreOpen,
    toggleMore: more.toggleMore,
    /** A coach rewrite landed in a field: open its section if it's folded away. */
    onCoachApplied: (field: AdTextField) => {
      more.openFor([field]);
    },
  };
}

export type AdBrief = ReturnType<typeof useAdBrief>;

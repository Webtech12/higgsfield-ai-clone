"use client";

import { Check, Circle } from "lucide-react";
import type { ReactNode } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";

import { AD_TEMPLATES, type AdBriefInput } from "@/contracts/ad";
import type { TalentCardModel } from "@/entities/talent";
import { cn } from "@/shared/lib/cn";
import { FadeInImage } from "@/shared/ui";

import type { PhotoUploads } from "../hooks/usePhotoUploads";
import { RATIO_OPTIONS } from "../model/briefCopy";
import type { BriefProgress, SubmitStatus } from "../model/briefProgress";
import { CreateButton } from "./CreateButton";

/**
 * "Your ad": the brief as it stands, beside the form on wide screens. It keeps the primary action in
 * view and shows what's still missing, so pressing Create is never a guess (ADR-028).
 */
export function BriefSummary({
  form,
  photos,
  cast,
  progress,
  status,
  isBusy,
}: {
  form: UseFormReturn<AdBriefInput>;
  photos: PhotoUploads;
  cast: TalentCardModel | null;
  progress: BriefProgress;
  status: SubmitStatus;
  isBusy: boolean;
}) {
  const [template, productName, aspectRatio] = useWatch({
    control: form.control,
    name: ["template", "productName", "aspectRatio"],
  });
  const ratio = RATIO_OPTIONS.find((option) => option.value === aspectRatio);
  const productPhotos = photos.itemsFor("product");

  return (
    <section
      aria-labelledby="summary-heading"
      className="rounded-3xl border border-border bg-card/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl"
    >
      <h2 id="summary-heading" className="font-display text-xl font-semibold tracking-[-0.02em]">
        Your ad
      </h2>
      <dl className="mt-5 space-y-4 text-sm">
        <SummaryRow label="Format">
          {AD_TEMPLATES[template].label}
          {ratio ? <span className="text-muted-foreground"> · {ratio.label}</span> : null}
        </SummaryRow>
        <SummaryRow label="Product">
          <span className={cn(!productName.trim() && "text-muted-foreground")}>
            {productName.trim() || "Not named yet"}
          </span>
          {productPhotos.length > 0 ? (
            <span className="mt-2 flex -space-x-2">
              {productPhotos.map((photo) => (
                <span
                  key={photo.key}
                  className="relative size-9 overflow-hidden rounded-lg border-2 border-card bg-muted"
                >
                  <FadeInImage
                    src={photo.previewUrl}
                    alt=""
                    className="absolute inset-0 size-full object-cover"
                  />
                </span>
              ))}
            </span>
          ) : null}
        </SummaryRow>
        <SummaryRow label="Starring">
          {cast ? (
            <span className="flex items-center gap-2.5">
              <span className="relative size-9 overflow-hidden rounded-full bg-muted">
                <FadeInImage
                  src={cast.cover.url}
                  alt=""
                  className="absolute inset-0 size-full object-cover"
                />
              </span>
              {cast.name}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {AD_TEMPLATES[template].needsTalent ? "No one cast yet" : "The product is the hero"}
            </span>
          )}
        </SummaryRow>
      </dl>
      <ul className="mt-6 space-y-2.5 border-t border-border pt-5" aria-label={progress.summary}>
        {progress.checks.map((check) => (
          <li key={check.id} className="flex items-center gap-2.5 text-sm">
            {check.isDone ? (
              <span className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-3" aria-hidden />
              </span>
            ) : (
              <Circle className="size-5 text-muted-foreground/60" aria-hidden />
            )}
            <span className={cn(check.isDone ? "text-muted-foreground" : "text-foreground")}>
              {check.label}
              {check.isRequired ? null : (
                <span className="text-muted-foreground"> · recommended</span>
              )}
            </span>
            <span className="sr-only">{check.isDone ? "(done)" : "(to do)"}</span>
          </li>
        ))}
      </ul>
      <CreateButton isBusy={isBusy} isUploading={photos.isUploading} className="mt-6 w-full" />
      <p
        role={status.isAlert ? "alert" : undefined}
        className={cn(
          "mt-3 text-center text-xs",
          status.isAlert ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {status.text}
      </p>
    </section>
  );
}

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 font-medium">{children}</dd>
    </div>
  );
}

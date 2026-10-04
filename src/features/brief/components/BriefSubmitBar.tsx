"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import { Controller, type UseFormReturn } from "react-hook-form";

import type { AdBriefInput } from "@/contracts/ad";
import { useIsHydrated } from "@/shared/lib/useIsHydrated";
import { Button } from "@/shared/ui";

import { RatioPicker } from "./RatioPicker";

/** The brief's last row: where the ad will run, and the button that sends it to the Director. */
export function BriefSubmitBar({
  form,
  isBusy,
  isUploading,
  error,
}: {
  form: UseFormReturn<AdBriefInput>;
  isBusy: boolean;
  isUploading: boolean;
  error: string | null;
}) {
  const isHydrated = useIsHydrated();
  const hasInvalidFields = form.formState.isSubmitted && !form.formState.isValid;
  const status = error
    ? { text: error, isAlert: true }
    : isUploading
      ? { text: "Waiting for your photos to finish uploading…", isAlert: false }
      : hasInvalidFields
        ? { text: "Check the highlighted fields above.", isAlert: true }
        : { text: "Free · storyboards in about a minute", isAlert: false };

  return (
    <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
      <Controller
        control={form.control}
        name="aspectRatio"
        render={({ field }) => <RatioPicker value={field.value} onChange={field.onChange} />}
      />
      <div className="flex flex-col items-stretch gap-1 sm:items-end">
        <Button type="submit" size="lg" disabled={!isHydrated || isBusy || isUploading}>
          {isBusy ? (
            <>
              <LoaderCircle className="animate-spin" aria-hidden /> Directing…
            </>
          ) : (
            <>
              Create 3 concepts <ArrowRight aria-hidden />
            </>
          )}
        </Button>
        <p
          role={status.isAlert ? "alert" : undefined}
          className={status.isAlert ? "text-xs text-destructive" : "text-xs text-muted-foreground"}
        >
          {status.text}
        </p>
      </div>
    </div>
  );
}

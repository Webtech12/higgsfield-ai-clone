"use client";

import { useMutation } from "@tanstack/react-query";
import { LoaderCircle, Sparkles } from "lucide-react";
import { useState } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";

import {
  CoachResult,
  type AdBriefInput,
  type CoachDraft,
  type CoachSuggestion,
} from "@/contracts/ad";
import { useRefreshMe } from "@/entities/viewer";
import { apiRequest } from "@/shared/lib/apiClient";
import { errorMessage } from "@/shared/lib/apiErrors";
import { Button } from "@/shared/ui";

import { canCoach, toCoachDraft } from "../model/briefForm";
import { CoachResults } from "./CoachResults";

/**
 * Polish with AI: the Director reviews the draft before anything is generated, so a rough brief
 * becomes a strong one. Free; suggestions are applied field by field, never silently (ADR-024).
 */
export function BriefCoach({ form }: { form: UseFormReturn<AdBriefInput> }) {
  const refreshMe = useRefreshMe();
  const [applied, setApplied] = useState<ReadonlySet<number>>(new Set());
  const [productName, benefit, sceneDirection] = useWatch({
    control: form.control,
    name: ["productName", "benefit", "sceneDirection"],
  });
  const coach = useMutation({
    mutationFn: (draft: CoachDraft) =>
      apiRequest("/coach", CoachResult, { method: "POST", body: draft }),
    // The first coaching call can be what creates the guest: show their starter credits.
    onSuccess: () => void refreshMe(),
  });

  const run = () => {
    setApplied(new Set());
    coach.mutate(toCoachDraft(form.getValues()));
  };
  const apply = (index: number, suggestion: CoachSuggestion) => {
    form.setValue(suggestion.field, suggestion.value, { shouldDirty: true, shouldValidate: true });
    setApplied((current) => new Set(current).add(index));
  };

  return (
    <section
      aria-labelledby="coach-heading"
      className="rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <h3 id="coach-heading" className="flex items-center gap-2 font-medium">
            <Sparkles className="size-4 text-primary" aria-hidden /> Polish with AI
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            A second opinion before you generate: sharper copy, what&apos;s missing and tips for
            this format. Free.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="shrink-0"
          onClick={run}
          disabled={!canCoach({ productName, benefit, sceneDirection }) || coach.isPending}
        >
          {coach.isPending ? (
            <>
              <LoaderCircle className="animate-spin" aria-hidden /> Reading your brief…
            </>
          ) : (
            <>
              <Sparkles aria-hidden /> {coach.data ? "Polish again" : "Polish with AI"}
            </>
          )}
        </Button>
      </div>
      <div aria-live="polite">
        {coach.isError ? (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {errorMessage(coach.error)}
          </p>
        ) : null}
        {coach.data ? <CoachResults result={coach.data} applied={applied} onApply={apply} /> : null}
      </div>
    </section>
  );
}

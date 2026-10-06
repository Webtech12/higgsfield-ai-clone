"use client";

import { useMutation } from "@tanstack/react-query";
import { LoaderCircle, Sparkles } from "lucide-react";
import { useState } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";

import {
  CoachResult,
  type AdBriefInput,
  type AdTextField,
  type CoachDraft,
  type CoachSuggestion,
} from "@/contracts/ad";
import { useRefreshMe } from "@/entities/viewer";
import { apiRequest } from "@/shared/lib/apiClient";
import { errorMessage } from "@/shared/lib/apiErrors";
import { ensureSession } from "@/shared/lib/session";
import { Button } from "@/shared/ui";

import { canCoach, toCoachDraft } from "../model/briefForm";
import { CoachResults } from "./CoachResults";

/**
 * Polish with AI: the brief is reviewed before anything is generated, so a rough brief becomes a
 * strong one. Free; suggestions are applied field by field, never silently (ADR-024).
 */
export function BriefCoach({
  form,
  onApplied,
}: {
  form: UseFormReturn<AdBriefInput>;
  /** A suggestion landed in a field, e.g. so a folded-away section can open to show it. */
  onApplied?: (field: AdTextField) => void;
}) {
  const refreshMe = useRefreshMe();
  const [applied, setApplied] = useState<ReadonlySet<number>>(new Set());
  const [productName, benefit, sceneDirection] = useWatch({
    control: form.control,
    name: ["productName", "benefit", "sceneDirection"],
  });
  const coach = useMutation({
    mutationFn: async (draft: CoachDraft) => {
      await ensureSession();
      return apiRequest("/coach", CoachResult, { method: "POST", body: draft });
    },
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
    onApplied?.(suggestion.field);
  };

  return (
    <section
      aria-labelledby="coach-heading"
      className="relative overflow-hidden rounded-2xl border border-primary/25 bg-[radial-gradient(120%_140%_at_0%_0%,rgb(150_202_74/9%),transparent_55%)] p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <h3
            id="coach-heading"
            className="flex items-center gap-2 font-display text-lg font-semibold tracking-[-0.01em]"
          >
            <Sparkles className="size-4 text-primary" aria-hidden /> Polish with AI
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            A second opinion before you create: sharper copy, what&apos;s missing and tips for this
            format. Free.
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

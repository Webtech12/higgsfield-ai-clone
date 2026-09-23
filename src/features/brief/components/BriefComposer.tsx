"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId } from "react";
import { Controller, useForm } from "react-hook-form";

import { BRIEF_IDEA_MAX, BRIEF_IDEA_MIN, BriefInput } from "@/contracts/brief";
import { CreateProjectResponse } from "@/contracts/project";
import { apiRequest } from "@/shared/lib/apiClient";
import { errorMessage } from "@/shared/lib/apiErrors";
import { Button } from "@/shared/ui";

import { RatioPicker } from "./RatioPicker";
import { StylePicker } from "./StylePicker";

/** The brief: submitting creates the project (and a guest, on first use) and opens the board. */
export function BriefComposer() {
  const ideaId = useId();
  const router = useRouter();
  const form = useForm<BriefInput>({
    resolver: zodResolver(BriefInput),
    defaultValues: { idea: "", aspectRatio: "16:9", styles: [] },
  });
  const create = useMutation({
    mutationFn: (brief: BriefInput) =>
      apiRequest("/projects", CreateProjectResponse, { method: "POST", body: brief }),
    onSuccess: ({ projectId }) => {
      router.push(`/p/${projectId}`);
    },
  });

  const submit = form.handleSubmit((brief) => {
    create.mutate(brief);
  });
  const ideaError = form.formState.errors.idea;
  const statusId = `${ideaId}-status`;
  const isBusy = create.isPending || create.isSuccess;

  return (
    <form
      className="rounded-xl border border-border bg-card/60 p-4 shadow-2xl shadow-black/40 backdrop-blur sm:p-5"
      onSubmit={(event) => void submit(event)}
      noValidate
    >
      <label htmlFor={ideaId} className="sr-only">
        What&apos;s your film about?
      </label>
      <textarea
        id={ideaId}
        {...form.register("idea")}
        maxLength={BRIEF_IDEA_MAX}
        rows={3}
        aria-invalid={ideaError ? true : undefined}
        aria-describedby={statusId}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) void submit();
        }}
        placeholder="What's your film about? A lighthouse keeper finds a message in a bottle from her future self…"
        className="w-full resize-none bg-transparent text-lg leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
      />

      <div className="mt-4 flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Controller
            control={form.control}
            name="aspectRatio"
            render={({ field }) => <RatioPicker value={field.value} onChange={field.onChange} />}
          />
          <Controller
            control={form.control}
            name="styles"
            render={({ field }) => <StylePicker value={field.value} onChange={field.onChange} />}
          />
        </div>

        <div className="flex flex-col items-stretch gap-1 sm:items-end">
          <Button type="submit" size="lg" disabled={isBusy}>
            {isBusy ? (
              <>
                <LoaderCircle className="animate-spin" aria-hidden /> Directing…
              </>
            ) : (
              <>
                Direct it <ArrowRight aria-hidden />
              </>
            )}
          </Button>
          <p
            id={statusId}
            role={ideaError || create.isError ? "alert" : undefined}
            className="text-xs"
          >
            {ideaError ? (
              <span className="text-destructive">
                Tell the Director a little more: at least {BRIEF_IDEA_MIN} characters.
              </span>
            ) : create.isError ? (
              <span className="text-destructive">{errorMessage(create.error)}</span>
            ) : (
              <span className="text-muted-foreground">Free to plan · Ctrl/⌘ + Enter</span>
            )}
          </p>
        </div>
      </div>
    </form>
  );
}

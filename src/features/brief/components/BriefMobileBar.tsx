"use client";

import { cn } from "@/shared/lib/cn";

import type { BriefProgress, SubmitStatus } from "../model/briefProgress";
import { CreateButton } from "./CreateButton";

/**
 * The phone's version of "Your ad": where the brief stands and the Create button, pinned above the
 * tab bar so the primary action is always one tap away.
 */
export function BriefMobileBar({
  progress,
  status,
  isBusy,
  isUploading,
}: {
  progress: BriefProgress;
  status: SubmitStatus;
  isBusy: boolean;
  isUploading: boolean;
}) {
  return (
    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-background/90 px-4 py-3 backdrop-blur-xl md:bottom-0 lg:hidden">
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{progress.summary}</p>
          <p
            role={status.isAlert ? "alert" : undefined}
            className={cn(
              "truncate text-xs",
              status.isAlert ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {status.text}
          </p>
        </div>
        <CreateButton isBusy={isBusy} isUploading={isUploading} size="md" />
      </div>
    </div>
  );
}

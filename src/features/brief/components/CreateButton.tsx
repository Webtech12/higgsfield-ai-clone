"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { useIsHydrated } from "@/shared/lib/useIsHydrated";
import { Button } from "@/shared/ui";

/**
 * The brief's one primary action. It waits for React to take over the form, because a click before
 * hydration would submit the form natively and lose the brief.
 */
export function CreateButton({
  isBusy,
  isUploading,
  size = "lg",
  className,
}: {
  isBusy: boolean;
  isUploading: boolean;
  size?: "md" | "lg";
  className?: string;
}) {
  const isHydrated = useIsHydrated();
  return (
    <Button
      type="submit"
      size={size}
      disabled={!isHydrated || isBusy || isUploading}
      className={cn(className)}
    >
      {isBusy ? (
        <>
          <LoaderCircle className="animate-spin" aria-hidden /> Starting…
        </>
      ) : (
        <>
          Create 3 concepts <ArrowRight aria-hidden />
        </>
      )}
    </Button>
  );
}

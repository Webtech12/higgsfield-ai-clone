import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full bg-background/80 px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm",
  {
    variants: {
      tone: {
        muted: "text-muted-foreground",
        info: "text-info",
        success: "text-success",
        danger: "text-destructive",
      },
    },
    defaultVariants: { tone: "muted" },
  },
);

type StatusBadgeProps = ComponentProps<"span"> & VariantProps<typeof statusBadgeVariants>;

/** A small status pill. Its tones match the status meta, and the in-progress one pulses. */
export function StatusBadge({ tone, className, children, ...props }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ tone }), className)} {...props}>
      <span
        aria-hidden
        className={cn("size-1.5 rounded-full bg-current", tone === "info" && "animate-pulse")}
      />
      {children}
    </span>
  );
}

import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

const FIELD =
  "w-full rounded-md border border-input bg-background/40 px-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50 aria-[invalid=true]:border-destructive";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(FIELD, "h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(FIELD, "min-h-20 resize-y py-2 leading-relaxed", className)}
      {...props}
    />
  );
}

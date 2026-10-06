import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

// 16 px text on phones, so iOS doesn't zoom into a field on focus.
const FIELD =
  "w-full rounded-xl border border-input bg-white/[0.03] px-3.5 text-base text-foreground transition-[border-color,box-shadow,background-color] duration-200 ease-out-quart placeholder:text-muted-foreground/60 hover:border-foreground/25 focus-visible:border-primary focus-visible:bg-white/[0.05] focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:outline-none disabled:opacity-50 aria-[invalid=true]:border-destructive sm:text-sm";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(FIELD, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(FIELD, "min-h-24 resize-y py-3 leading-relaxed", className)}
      {...props}
    />
  );
}

import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

/** A toggle chip: a button that reports its state with aria-pressed. */
export function Chip({
  isOn,
  className,
  ...props
}: Omit<ComponentProps<"button">, "aria-pressed"> & { isOn: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={isOn}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40",
        isOn
          ? "border-primary/60 bg-primary/10 text-foreground"
          : "border-input text-muted-foreground hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

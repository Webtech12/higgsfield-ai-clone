import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

/** A toggle chip: a button that reports its state with aria-pressed. 44 px tall on touch screens. */
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
        "inline-flex h-9 items-center rounded-full border px-4 text-[13px] font-medium transition-[background-color,border-color,color,transform] duration-200 ease-out-quart focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35 pointer-coarse:h-11",
        isOn
          ? "border-primary bg-primary/12 text-foreground"
          : "border-input text-muted-foreground hover:border-foreground/30 hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

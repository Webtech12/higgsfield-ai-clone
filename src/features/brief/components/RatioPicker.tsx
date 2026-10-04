"use client";

import type { AspectRatio } from "@/contracts/brief";
import { cn } from "@/shared/lib/cn";

import { RATIO_OPTIONS } from "../model/briefCopy";

/** Where the ad will run decides its shape; fixed before any frame is drawn (AGENTS.md §1). */
export function RatioPicker({
  value,
  onChange,
}: {
  value: AspectRatio;
  onChange: (ratio: AspectRatio) => void;
}) {
  return (
    <fieldset className="flex rounded-md border border-input p-0.5">
      <legend className="sr-only">Aspect ratio</legend>
      {RATIO_OPTIONS.map((option) => (
        <label
          key={option.value}
          title={option.where}
          className={cn(
            "relative cursor-pointer rounded-sm px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
            value === option.value && "bg-accent text-foreground",
          )}
        >
          <input
            type="radio"
            name="aspectRatio"
            value={option.value}
            checked={value === option.value}
            onChange={() => {
              onChange(option.value);
            }}
            className="sr-only"
          />
          {option.value} <span className="hidden sm:inline">· {option.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

"use client";

import type { AspectRatio } from "@/contracts/brief";
import { cn } from "@/shared/lib/cn";

import { RATIO_OPTIONS } from "../model/briefCopy";

/** The shape itself, drawn: a glance tells vertical from square from wide. */
const GLYPH = {
  "9:16": "h-3.5 w-2",
  "1:1": "size-3",
  "16:9": "h-2 w-3.5",
} satisfies Record<AspectRatio, string>;

/** Where the ad will run decides its shape; fixed before any frame is drawn (AGENTS.md §1). */
export function RatioPicker({
  value,
  onChange,
}: {
  value: AspectRatio;
  onChange: (ratio: AspectRatio) => void;
}) {
  return (
    <fieldset className="inline-flex max-w-full rounded-full border border-input p-1">
      <legend className="sr-only">Aspect ratio</legend>
      {RATIO_OPTIONS.map((option) => {
        const isOn = value === option.value;
        return (
          <label
            key={option.value}
            title={option.where}
            className={cn(
              "relative inline-flex h-9 cursor-pointer items-center gap-2 rounded-full px-3.5 text-[13px] font-medium transition-colors duration-200 ease-out-quart has-focus-visible:ring-2 has-focus-visible:ring-ring pointer-coarse:h-11",
              isOn
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <input
              type="radio"
              name="aspectRatio"
              value={option.value}
              checked={isOn}
              onChange={() => {
                onChange(option.value);
              }}
              className="sr-only"
            />
            <span
              aria-hidden
              className={cn("rounded-[2px] border-[1.5px] border-current", GLYPH[option.value])}
            />
            {option.value}
            <span className="hidden sm:inline">· {option.label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}

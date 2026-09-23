"use client";

import { ASPECT_RATIOS, type AspectRatio } from "@/contracts/brief";
import { cn } from "@/shared/lib/cn";

const RATIO_LABEL = {
  "16:9": "Wide",
  "9:16": "Vertical",
  "1:1": "Square",
} satisfies Record<AspectRatio, string>;

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
      {ASPECT_RATIOS.map((option) => (
        <label
          key={option}
          className={cn(
            "cursor-pointer rounded-sm px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
            value === option && "bg-accent text-foreground",
          )}
        >
          <input
            type="radio"
            name="aspectRatio"
            value={option}
            checked={value === option}
            onChange={() => {
              onChange(option);
            }}
            className="sr-only"
          />
          {option} <span className="hidden sm:inline">· {RATIO_LABEL[option]}</span>
        </label>
      ))}
    </fieldset>
  );
}

"use client";

import { BRIEF_MAX_STYLES, STYLE_TAGS, type StyleTag } from "@/contracts/brief";
import { cn } from "@/shared/lib/cn";

const STYLE_LABEL = {
  noir: "Noir",
  dreamy: "Dreamy",
  documentary: "Documentary",
  commercial: "Commercial",
  anime: "Anime",
  retro: "Retro",
} satisfies Record<StyleTag, string>;

/** Optional style hints: toggle up to three. Hints for the Director, never a model choice. */
export function StylePicker({
  value,
  onChange,
}: {
  value: StyleTag[];
  onChange: (styles: StyleTag[]) => void;
}) {
  const toggle = (tag: StyleTag) => {
    if (value.includes(tag)) onChange(value.filter((t) => t !== tag));
    else if (value.length < BRIEF_MAX_STYLES) onChange([...value, tag]);
  };

  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Style (optional, up to 3)">
      {STYLE_TAGS.map((tag) => {
        const isOn = value.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            aria-pressed={isOn}
            onClick={() => {
              toggle(tag);
            }}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              isOn
                ? "border-primary/60 bg-primary/10 text-foreground"
                : "border-input text-muted-foreground hover:text-foreground",
            )}
          >
            {STYLE_LABEL[tag]}
          </button>
        );
      })}
    </div>
  );
}

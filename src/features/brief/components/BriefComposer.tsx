"use client";

import { ArrowRight } from "lucide-react";
import { useId, useState } from "react";

import {
  ASPECT_RATIOS,
  BRIEF_IDEA_MAX,
  BRIEF_MAX_STYLES,
  STYLE_TAGS,
  type AspectRatio,
  type StyleTag,
} from "@/contracts/brief";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui";

const RATIO_LABEL = {
  "16:9": "Wide",
  "9:16": "Vertical",
  "1:1": "Square",
} satisfies Record<AspectRatio, string>;

const STYLE_LABEL = {
  noir: "Noir",
  dreamy: "Dreamy",
  documentary: "Documentary",
  commercial: "Commercial",
  anime: "Anime",
  retro: "Retro",
} satisfies Record<StyleTag, string>;

/**
 * The brief form's layout. Submitting is wired up in S2 (docs/plan.md); until then the button
 * explains why it is disabled rather than failing silently.
 */
export function BriefComposer() {
  const ideaId = useId();
  const [idea, setIdea] = useState("");
  const [ratio, setRatio] = useState<AspectRatio>("16:9");
  const [styles, setStyles] = useState<StyleTag[]>([]);

  const toggleStyle = (tag: StyleTag) => {
    setStyles((current) =>
      current.includes(tag)
        ? current.filter((t) => t !== tag)
        : current.length < BRIEF_MAX_STYLES
          ? [...current, tag]
          : current,
    );
  };

  return (
    <form
      className="rounded-xl border border-border bg-card/60 p-4 shadow-2xl shadow-black/40 backdrop-blur sm:p-5"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <label htmlFor={ideaId} className="sr-only">
        What&apos;s your film about?
      </label>
      <textarea
        id={ideaId}
        value={idea}
        onChange={(event) => {
          setIdea(event.target.value);
        }}
        maxLength={BRIEF_IDEA_MAX}
        rows={3}
        placeholder="What's your film about? A lighthouse keeper finds a message in a bottle from her future self…"
        className="w-full resize-none bg-transparent text-lg leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
      />

      <div className="mt-4 flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <fieldset className="flex rounded-md border border-input p-0.5">
            <legend className="sr-only">Aspect ratio</legend>
            {ASPECT_RATIOS.map((option) => (
              <label
                key={option}
                className={cn(
                  "cursor-pointer rounded-sm px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                  ratio === option && "bg-accent text-foreground",
                )}
              >
                <input
                  type="radio"
                  name="aspectRatio"
                  value={option}
                  checked={ratio === option}
                  onChange={() => {
                    setRatio(option);
                  }}
                  className="sr-only"
                />
                {option} <span className="hidden sm:inline">· {RATIO_LABEL[option]}</span>
              </label>
            ))}
          </fieldset>

          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label="Style (optional, up to 3)"
          >
            {STYLE_TAGS.map((tag) => {
              const isOn = styles.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={isOn}
                  onClick={() => {
                    toggleStyle(tag);
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
        </div>

        <div className="flex flex-col items-stretch gap-1 sm:items-end">
          <Button type="submit" size="lg" disabled aria-describedby={`${ideaId}-status`}>
            Direct it <ArrowRight aria-hidden />
          </Button>
          <p id={`${ideaId}-status`} className="text-xs text-muted-foreground">
            Directing opens with the next deploy.
          </p>
        </div>
      </div>
    </form>
  );
}

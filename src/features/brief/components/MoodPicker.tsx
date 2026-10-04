"use client";

import { useId } from "react";

import { AD_MAX_MOODS, AD_MOODS, type AdMood } from "@/contracts/ad";
import { Chip } from "@/shared/ui";

import { MOOD_LABEL } from "../model/briefCopy";

/** Optional tone hints: toggle up to three. Hints for the Director, never a model choice. */
export function MoodPicker({
  value,
  onChange,
}: {
  value: AdMood[];
  onChange: (moods: AdMood[]) => void;
}) {
  const labelId = useId();
  const isFull = value.length >= AD_MAX_MOODS;
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium" id={labelId}>
        Mood{" "}
        <span className="font-normal text-muted-foreground">Optional, up to {AD_MAX_MOODS}</span>
      </p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby={labelId}>
        {AD_MOODS.map((mood) => {
          const isOn = value.includes(mood);
          return (
            <Chip
              key={mood}
              isOn={isOn}
              disabled={!isOn && isFull}
              onClick={() => {
                onChange(isOn ? value.filter((m) => m !== mood) : [...value, mood]);
              }}
            >
              {MOOD_LABEL[mood]}
            </Chip>
          );
        })}
      </div>
    </div>
  );
}

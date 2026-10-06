"use client";

import { Check } from "lucide-react";

import { AD_TEMPLATE_IDS, AD_TEMPLATES, type AdTemplateId } from "@/contracts/ad";
import { cn } from "@/shared/lib/cn";

import { beatDetail, beatName } from "../model/briefForm";

/**
 * The ad format: proven structures whose three beats become the three shots. The chosen format's
 * beats show right under it (mapping: choose a format, see your three shots). On phones the formats
 * scroll sideways instead of stacking into a tall list.
 */
export function TemplatePicker({
  value,
  onChange,
}: {
  value: AdTemplateId;
  onChange: (template: AdTemplateId) => void;
}) {
  const selected = AD_TEMPLATES[value];
  return (
    <div className="flex flex-col gap-4">
      <fieldset>
        <legend className="sr-only">Ad format</legend>
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 xl:grid-cols-5">
          {AD_TEMPLATE_IDS.map((id) => {
            const template = AD_TEMPLATES[id];
            const isOn = id === value;
            return (
              <label
                key={id}
                className={cn(
                  "relative flex w-[64%] shrink-0 cursor-pointer snap-start flex-col gap-1.5 rounded-2xl border p-4 transition-[border-color,background-color] duration-200 ease-out-quart has-focus-visible:ring-2 has-focus-visible:ring-ring sm:w-auto",
                  isOn
                    ? "border-primary bg-primary/[0.07]"
                    : "border-border hover:border-foreground/25",
                )}
              >
                <input
                  type="radio"
                  name="template"
                  value={id}
                  checked={isOn}
                  onChange={() => {
                    onChange(id);
                  }}
                  className="sr-only"
                />
                <span className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold">{template.label}</span>
                  {isOn ? (
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" aria-hidden />
                    </span>
                  ) : null}
                </span>
                <span className="text-xs leading-relaxed text-muted-foreground">
                  {template.pitch}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <ol className="grid gap-2 sm:grid-cols-3" aria-label={`${selected.label}: the three shots`}>
        {selected.beats.map((beat, index) => (
          <li key={beat} className="flex gap-3 rounded-xl bg-white/[0.03] p-3.5">
            <span className="grid size-6 shrink-0 place-items-center rounded-full border border-primary/50 text-[11px] font-semibold text-primary">
              {index + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{beatName(beat)}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                {beatDetail(beat)}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

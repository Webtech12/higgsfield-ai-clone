"use client";

import { AD_TEMPLATE_IDS, AD_TEMPLATES, type AdTemplateId } from "@/contracts/ad";
import { cn } from "@/shared/lib/cn";

import { beatDetail, beatName } from "../model/briefForm";

/** The ad format: proven structures whose three beats become the three shots. */
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
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {AD_TEMPLATE_IDS.map((id) => {
            const template = AD_TEMPLATES[id];
            const isOn = id === value;
            return (
              <label
                key={id}
                className={cn(
                  "relative flex cursor-pointer flex-col gap-1 rounded-lg border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                  isOn ? "border-primary bg-primary/5" : "border-border hover:border-input",
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
                <span className="text-sm font-medium">{template.label}</span>
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
          <li key={beat} className="rounded-md border border-border bg-background/40 p-3">
            <p className="font-mono text-xs text-primary">
              {index + 1} · {beatName(beat)}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{beatDetail(beat)}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

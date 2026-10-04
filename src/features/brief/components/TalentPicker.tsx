"use client";

import { Package } from "lucide-react";

import { TalentCard, TalentProfile, type TalentCardModel } from "@/entities/talent";
import { cn } from "@/shared/lib/cn";
import { Button, DialogClose } from "@/shared/ui";

/**
 * Casting: one talent from the roster of people who signed a release (ADR-024). A format without a
 * person (product hero) also offers "no talent".
 */
export function TalentPicker({
  roster,
  value,
  onChange,
  allowNone,
  error,
}: {
  roster: TalentCardModel[];
  value: string | null;
  onChange: (talentId: string | null) => void;
  allowNone: boolean;
  error?: string | undefined;
}) {
  if (roster.length === 0 && !allowNone) {
    return (
      <p className="rounded-lg border border-border bg-background/40 p-4 text-sm text-muted-foreground">
        The talent roster is being set up. Choose the Product hero format to make an ad without a
        person, or check back soon.
      </p>
    );
  }
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="sr-only">Talent</legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {allowNone ? (
          <label
            className={cn(
              "relative flex aspect-[4/5] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border p-3 text-center transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
              value === null ? "border-primary bg-primary/5" : "border-border hover:border-input",
            )}
          >
            <input
              type="radio"
              name="talent"
              className="sr-only"
              checked={value === null}
              onChange={() => {
                onChange(null);
              }}
            />
            <Package className="size-6 text-muted-foreground" aria-hidden />
            <span className="text-sm font-medium">No talent</span>
            <span className="text-xs text-muted-foreground">The product is the hero</span>
          </label>
        ) : null}
        {roster.map((talent) => (
          <div key={talent.id} className="flex flex-col gap-1">
            <label className="relative cursor-pointer rounded-lg has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
              <input
                type="radio"
                name="talent"
                className="sr-only"
                aria-label={`Cast ${talent.name}, ${talent.tagline}`}
                checked={value === talent.id}
                onChange={() => {
                  onChange(talent.id);
                }}
              />
              <TalentCard talent={talent} isSelected={value === talent.id} />
            </label>
            <TalentProfile
              talent={talent}
              trigger={
                <Button type="button" variant="ghost" size="sm" className="self-start">
                  View profile
                </Button>
              }
              action={
                <DialogClose asChild>
                  <Button
                    type="button"
                    onClick={() => {
                      onChange(talent.id);
                    }}
                  >
                    Cast {talent.name}
                  </Button>
                </DialogClose>
              }
            />
          </div>
        ))}
      </div>
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

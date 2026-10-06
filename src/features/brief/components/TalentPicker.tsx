"use client";

import { Package } from "lucide-react";

import { TalentCard, TalentProfile, type TalentCardModel } from "@/entities/talent";
import { cn } from "@/shared/lib/cn";
import { Button, DialogClose } from "@/shared/ui";

/**
 * Casting: one talent from the roster of people who signed a release (ADR-024). A format without a
 * person (product hero) also offers "no talent". On phones the roster scrolls sideways.
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
      <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
        The talent roster is being set up. Choose the Product hero format to make an ad without a
        person, or check back soon.
      </p>
    );
  }
  return (
    // min-w-0: a fieldset is as wide as its content by default, so the roster wouldn't scroll on
    // a phone; it would stretch the page instead.
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="sr-only">Talent</legend>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 xl:grid-cols-5">
        {allowNone ? (
          <label
            className={cn(
              "relative flex aspect-[4/5] w-[44%] shrink-0 cursor-pointer snap-start flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-center transition-colors duration-200 has-focus-visible:ring-2 has-focus-visible:ring-ring sm:w-auto",
              value === null
                ? "border-primary bg-primary/[0.07]"
                : "border-dashed border-border hover:border-foreground/25",
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
            <span className="text-sm font-semibold">No talent</span>
            <span className="text-xs text-muted-foreground">The product is the hero</span>
          </label>
        ) : null}
        {roster.map((talent) => (
          <div
            key={talent.id}
            className="flex w-[44%] shrink-0 snap-start flex-col gap-1 sm:w-auto"
          >
            <label className="relative cursor-pointer rounded-2xl has-focus-visible:ring-2 has-focus-visible:ring-ring">
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
                <Button type="button" variant="ghost" size="sm" className="-ml-2 self-start">
                  View profile
                </Button>
              }
              action={
                <DialogClose asChild>
                  <Button
                    type="button"
                    size="lg"
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

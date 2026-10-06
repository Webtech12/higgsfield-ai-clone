"use client";

import { ChevronDown } from "lucide-react";
import { useId, type ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * The optional fields, folded away so the brief is short by default (progressive disclosure). The
 * panel stays mounted when closed, so typed values survive; it opens itself when a field inside has
 * a value, an error or a fresh suggestion.
 */
export function MoreDirection({
  isOpen,
  onToggle,
  children,
}: {
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    // The region is named by its title alone; the summary under it belongs to the button.
    <section
      aria-labelledby={`${id}-title`}
      className={cn(
        "rounded-2xl border transition-colors duration-300",
        isOpen
          ? "border-border bg-card/50"
          : "border-dashed border-border hover:border-foreground/25",
      )}
    >
      <h2>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={`${id}-panel`}
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-4 rounded-2xl p-5 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:p-6"
        >
          <span>
            <span
              id={`${id}-title`}
              className="font-display text-lg font-semibold tracking-[-0.01em]"
            >
              More direction
            </span>
            <span className="ml-2 text-sm text-muted-foreground">Optional</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              Audience, message, call to action, mood and scene. Skip it and we decide.
            </span>
          </span>
          <span
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-full border border-input transition-transform duration-300 ease-out-expo",
              isOpen && "rotate-180",
            )}
          >
            <ChevronDown className="size-4" aria-hidden />
          </span>
        </button>
      </h2>
      <div id={`${id}-panel`} hidden={!isOpen} className="border-t border-border p-5 sm:p-6">
        {children}
      </div>
    </section>
  );
}

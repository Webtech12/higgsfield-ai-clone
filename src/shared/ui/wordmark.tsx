import { cn } from "@/shared/lib/cn";

/**
 * The product's name as a wordmark, until Citrus Talent's official logo files arrive (ADR-028): when
 * they do, the mark changes here and nowhere else.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className="grid size-8 place-items-center rounded-full bg-primary font-display text-[0.7rem] font-bold tracking-tight text-primary-foreground"
      >
        CT
      </span>
      <span className="font-display text-[1.05rem] leading-none font-semibold tracking-tight whitespace-nowrap">
        Citrus Talent <span className="font-normal text-muted-foreground">Studio</span>
      </span>
    </span>
  );
}

import { Users } from "lucide-react";
import Link from "next/link";

import { Button } from "@/shared/ui";

/** No one on the roster yet: say so, and offer what still works (a product-only ad). */
export function EmptyRoster() {
  return (
    <div className="flex flex-col items-start gap-5 rounded-2xl border border-dashed border-border p-8 sm:p-12">
      <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
        <Users className="size-5" aria-hidden />
      </span>
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-[-0.02em]">
          The roster is being set up
        </h2>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
          Talent appears here once their release is signed. Meanwhile, a product hero ad needs no
          one on screen.
        </p>
      </div>
      <Button asChild size="lg">
        <Link href="/">Start a brief</Link>
      </Button>
    </div>
  );
}

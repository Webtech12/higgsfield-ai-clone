"use client";

import { Coins } from "lucide-react";

import { useMe } from "@/entities/viewer";

/** The balance in the header (AGENTS.md §1). Hidden for visitors who haven't started anything. */
export function CreditsBadge() {
  const { data } = useMe();
  if (!data?.user) return null;

  return (
    <p
      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border px-3 py-1 text-xs whitespace-nowrap text-muted-foreground"
      aria-live="polite"
    >
      <Coins className="size-3.5 text-primary" aria-hidden />
      <span>
        <span className="font-medium text-foreground">{data.credits}</span> credits
      </span>
      {/* On a phone the header has room for the balance only. */}
      {data.user.isGuest ? (
        <span className="hidden text-muted-foreground/80 sm:inline">· Guest</span>
      ) : null}
    </p>
  );
}

"use client";

import { Bell, BellRing } from "lucide-react";

import { Button } from "@/shared/ui";

import { useNotificationPermission } from "../hooks/useNotificationPermission";

/**
 * The opt-in for a browser notification when the wait is over (ADR-028). The browser asks only after
 * a click, never on page load. Once allowed it just says so; after a "no" it stays out of the way.
 */
export function NotifyMe() {
  const { permission, request } = useNotificationPermission();
  if (permission === "granted") {
    return (
      <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <BellRing className="size-4 text-primary" aria-hidden />
        We’ll notify you when it’s ready
      </p>
    );
  }
  if (permission !== "default") return null;
  return (
    <Button type="button" variant="ghost" size="sm" onClick={() => void request()}>
      <Bell aria-hidden /> Notify me when it’s ready
    </Button>
  );
}

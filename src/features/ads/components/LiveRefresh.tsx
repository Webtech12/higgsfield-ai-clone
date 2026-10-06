"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** How often the library re-reads itself while something is being made. */
const REFRESH_MS = 8000;

/**
 * Keeps a server-rendered list current while work is under way: it re-renders the page on an
 * interval, and stops as soon as nothing is in progress.
 */
export function LiveRefresh({ isActive }: { isActive: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!isActive) return;
    const timer = window.setInterval(() => {
      router.refresh();
    }, REFRESH_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [isActive, router]);
  return null;
}

"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

import type { WorkspaceView } from "@/contracts/project";
import { useToast, type ToastMessage } from "@/shared/ui";

import { arrivalOf, isWaiting, phaseOf, titlePrefix, type AdPhase } from "../model/readyAlert";
import { notificationPermission } from "./useNotificationPermission";

/** The brand mark with a neon dot (public/icon-ready.svg). */
const READY_ICON = "/icon-ready.svg";

/**
 * Puts the ad's progress in front of the page's title, and puts the title back afterwards. Next.js
 * streams a page's <title> in after the page itself renders, so the head is watched and the prefix
 * put back whenever the title is replaced.
 */
function useTabTitle(prefix: string | null) {
  useEffect(() => {
    if (!prefix) return;
    const lead = `${prefix} · `;
    let base = document.title;
    const apply = () => {
      if (document.title.startsWith(lead)) return;
      base = document.title;
      document.title = `${lead}${base}`;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => {
      observer.disconnect();
      // A navigation may already have given the tab the next page's title: only undo our own.
      if (document.title === `${lead}${base}`) document.title = base;
    };
  }, [prefix]);
}

/** Calls back once each time the ad reaches a phase worth announcing. */
function useArrivals(phase: AdPhase, onArrival: (message: ToastMessage) => void) {
  const previous = useRef<AdPhase | null>(null);
  const announce = useEffectEvent(onArrival);
  useEffect(() => {
    const message = arrivalOf(previous.current, phase);
    previous.current = phase;
    if (message) announce(message);
  }, [phase]);
}

/**
 * News that lands while the tab is in the background waits for the brand: the favicon gets a dot,
 * and the in-page message shows when they come back, so it can't time out unseen.
 */
function useHeldNews(show: (message: ToastMessage) => void) {
  const [held, setHeld] = useState<ToastMessage | null>(null);
  const deliver = useEffectEvent(show);
  useEffect(() => {
    if (!held) return;
    // Our own icon link, added last so it wins; removing it brings the page's icon back.
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.href = READY_ICON;
    document.head.append(link);
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      deliver(held);
      setHeld(null);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      link.remove();
    };
  }, [held]);
  return (message: ToastMessage) => {
    if (document.visibilityState === "hidden") setHeld(message);
    else show(message);
  };
}

/** A system notification, only when the brand opted in and is looking at another tab. */
function notifyInBackground(message: ToastMessage, tag: string) {
  if (document.visibilityState !== "hidden" || notificationPermission() !== "granted") return;
  try {
    const notification = new Notification(message.title, {
      body: message.body ?? "",
      icon: "/icon.svg",
      tag,
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {
    // A browser that only notifies through a service worker refuses the constructor. The tab title
    // and the favicon dot still carry the news, so there is nothing else to do.
  }
}

/**
 * Tells the brand when the work they waited for arrives (ADR-028), wherever they are: the tab title
 * counts progress, an in-page message (announced to screen readers) marks the arrival, the favicon
 * gets a dot while the tab is in the background, and an opt-in notification reaches another window.
 */
export function useReadyAlerts(view: WorkspaceView) {
  const phase = phaseOf(view);
  const { notify } = useToast();
  const tell = useHeldNews(notify);

  useTabTitle(titlePrefix(view));
  useArrivals(phase, (message) => {
    tell(message);
    notifyInBackground(message, view.id);
  });

  return { phase, canNotify: !view.isDemo && isWaiting(phase) };
}

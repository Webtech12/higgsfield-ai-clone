"use client";

import { useSyncExternalStore } from "react";

/** Null until the page runs in a browser, where it can find out. */
export type NotifyPermission = NotificationPermission | "unsupported" | null;

const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/**
 * Desktop browsers only: phones show web notifications only through a service worker, which this
 * app doesn't register, so offering them there would be a promise we can't keep.
 */
export function notificationPermission(): Exclude<NotifyPermission, null> {
  if (typeof Notification === "undefined" || !window.matchMedia("(pointer: fine)").matches) {
    return "unsupported";
  }
  return Notification.permission;
}

/** Whether the browser may show this site's notifications, and a way to ask (on a click only). */
export function useNotificationPermission() {
  const permission = useSyncExternalStore<NotifyPermission>(
    subscribe,
    notificationPermission,
    () => null,
  );
  return {
    permission,
    request: async () => {
      await Notification.requestPermission();
      listeners.forEach((listener) => {
        listener();
      });
    },
  };
}

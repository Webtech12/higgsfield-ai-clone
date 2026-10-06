"use client";

import { Check, Info, TriangleAlert, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/shared/lib/cn";

export type ToastTone = "success" | "info" | "danger";

export interface ToastMessage {
  title: string;
  body?: string;
  tone?: ToastTone;
}

interface ToastEntry extends ToastMessage {
  id: number;
}

const TONE_ICON = { success: Check, info: Info, danger: TriangleAlert } satisfies Record<
  ToastTone,
  typeof Check
>;

/** Long enough to read twice; dismissible sooner. */
const TOAST_MS = 7000;
/** A few at most: the newest matter, and older ones fall away. */
const MAX_TOASTS = 3;

const ToastContext = createContext<{ notify: (toast: ToastMessage) => void } | null>(null);

/**
 * In-page messages for things that finish while you're looking elsewhere on the page. The region
 * is always in the document and polite, so screen readers announce each toast without stealing
 * focus.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (toast: ToastMessage) => {
      counter.current += 1;
      const id = counter.current;
      setToasts((current) => [...current.slice(-(MAX_TOASTS - 1)), { ...toast, id }]);
      window.setTimeout(() => {
        dismiss(id);
      }, TOAST_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-20 z-50 flex w-[min(24rem,calc(100%-2rem))] flex-col gap-2 md:bottom-6"
      >
        {toasts.map((toast) => {
          const tone = toast.tone ?? "info";
          const Icon = TONE_ICON[tone];
          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex animate-toast items-start gap-3 rounded-2xl border border-border bg-popover/95 p-4 shadow-2xl shadow-black/60 backdrop-blur-xl"
            >
              <span
                className={cn(
                  "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full",
                  tone === "success" && "bg-primary text-primary-foreground",
                  tone === "info" && "bg-accent text-foreground",
                  tone === "danger" && "bg-destructive/15 text-destructive",
                )}
              >
                <Icon className="size-3.5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.body ? (
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                    {toast.body}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => {
                  dismiss(toast.id);
                }}
                className="-m-1 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                aria-label="Dismiss"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext>
  );
}

export function useToast(): { notify: (toast: ToastMessage) => void } {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast needs a ToastProvider above it");
  return context;
}

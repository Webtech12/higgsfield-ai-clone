"use client";

import { ImagePlus, LoaderCircle, TriangleAlert, X } from "lucide-react";
import { useId, useState } from "react";

import { REFERENCE_LIMITS, type ReferenceRole } from "@/contracts/ad";
import { UPLOAD_CONTENT_TYPES } from "@/contracts/upload";
import { cn } from "@/shared/lib/cn";

import type { PhotoItem, PhotoUploads } from "../hooks/usePhotoUploads";

const ROLE_NOUN = { product: "product photo", scene: "scene photo" } satisfies Record<
  ReferenceRole,
  string
>;

/** Thumbnails of one kind of photo, with an add button that also takes dropped files. */
export function PhotoUploader({
  kind: role,
  photos,
  label,
  hint,
}: {
  /** Which photos these are; not called `role`, which reads as an ARIA role. */
  kind: ReferenceRole;
  photos: PhotoUploads;
  label: string;
  hint: string;
}) {
  const inputId = useId();
  const [notice, setNotice] = useState<string | null>(null);
  const items = photos.itemsFor(role);
  const limit = REFERENCE_LIMITS[role];
  const isFull = items.length >= limit;

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const leftOut = photos.add(role, [...files]);
    setNotice(
      leftOut > 0
        ? `Up to ${String(limit)} ${ROLE_NOUN[role]}s: ${String(leftOut)} left out.`
        : null,
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium">{label}</p>
        <span className="text-xs text-muted-foreground tabular-nums">
          {items.length}/{limit}
        </span>
      </div>
      <ul
        className="flex flex-wrap gap-2.5"
        aria-label={`${label}: ${String(items.length)} of ${String(limit)}`}
      >
        {items.map((item, index) => (
          <Thumbnail
            key={item.key}
            item={item}
            label={`${ROLE_NOUN[role]} ${String(index + 1)}`}
            onRemove={() => {
              photos.remove(item.key);
            }}
          />
        ))}
        {isFull ? null : (
          <li>
            <label
              htmlFor={inputId}
              onDragOver={(event) => {
                event.preventDefault();
              }}
              onDrop={(event) => {
                event.preventDefault();
                addFiles(event.dataTransfer.files);
              }}
              className="flex size-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-input text-xs font-medium text-muted-foreground transition-[border-color,color,background-color] duration-200 ease-out-quart hover:border-primary hover:bg-primary/5 hover:text-foreground has-focus-visible:ring-2 has-focus-visible:ring-ring"
            >
              <ImagePlus className="size-5" aria-hidden />
              Add photo
              <input
                id={inputId}
                type="file"
                accept={UPLOAD_CONTENT_TYPES.join(",")}
                multiple
                className="sr-only"
                aria-describedby={`${inputId}-hint`}
                onChange={(event) => {
                  addFiles(event.target.files);
                  event.target.value = "";
                }}
              />
            </label>
          </li>
        )}
      </ul>
      <p id={`${inputId}-hint`} className="text-xs leading-relaxed text-muted-foreground">
        {notice ?? hint}
      </p>
    </div>
  );
}

function Thumbnail({
  item,
  label,
  onRemove,
}: {
  item: PhotoItem;
  label: string;
  onRemove: () => void;
}) {
  return (
    <li className="relative size-28 animate-rise overflow-hidden rounded-xl border border-border bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element -- a local object URL preview */}
      <img
        src={item.previewUrl}
        alt={label}
        className={cn("size-full object-cover", item.status !== "ready" && "opacity-50")}
      />
      {item.status === "uploading" ? (
        <span className="absolute inset-0 flex items-center justify-center" role="status">
          <LoaderCircle className="size-5 animate-spin" aria-hidden />
          <span className="sr-only">Uploading {label}</span>
        </span>
      ) : null}
      {item.status === "failed" ? (
        <span
          className="absolute inset-x-0 bottom-0 flex items-start gap-1 bg-background/90 p-1 text-[10px] leading-tight text-destructive"
          role="alert"
        >
          <TriangleAlert className="size-3 shrink-0" aria-hidden />
          {item.error}
        </span>
      ) : null}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1.5 right-1.5 rounded-full bg-black/70 p-1.5 text-white backdrop-blur transition-colors hover:bg-black focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        aria-label={`Remove ${label}`}
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </li>
  );
}

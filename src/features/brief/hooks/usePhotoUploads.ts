"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { REFERENCE_LIMITS, type AdReferenceInput, type ReferenceRole } from "@/contracts/ad";
import { UPLOAD_CONTENT_TYPES, UploadResponse } from "@/contracts/upload";
import { ApiError, apiUpload } from "@/shared/lib/apiClient";
import { errorMessage } from "@/shared/lib/apiErrors";

import { downscale } from "../lib/downscale";

export type PhotoStatus = "uploading" | "ready" | "failed";

export interface PhotoItem {
  key: string;
  role: ReferenceRole;
  /** A local preview, shown at once while the upload runs. */
  previewUrl: string;
  status: PhotoStatus;
  uploadId: string | null;
  error: string | null;
}

const UNREADABLE = "This photo couldn't be read. Try a JPEG, PNG or WebP.";
const isAccepted = (file: File) => (UPLOAD_CONTENT_TYPES as readonly string[]).includes(file.type);

/** Shrinks and uploads one photo: its upload id, or the reason it failed in the brand's words. */
async function uploadPhoto(file: File): Promise<Pick<PhotoItem, "status" | "uploadId" | "error">> {
  try {
    const { blob, filename } = await downscale(file);
    const { uploadId } = await apiUpload("/uploads", UploadResponse, blob, filename);
    return { status: "ready", uploadId, error: null };
  } catch (error) {
    const reason = error instanceof ApiError ? errorMessage(error) : UNREADABLE;
    return { status: "failed", uploadId: null, error: reason };
  }
}

/** Object URLs for local previews: they hold memory until revoked, so every one is released. */
function usePreviewUrls() {
  const urls = useRef(new Set<string>());
  useEffect(() => {
    const created = urls.current;
    return () => {
      for (const url of created) URL.revokeObjectURL(url);
    };
  }, []);
  return {
    create(file: File): string {
      const url = URL.createObjectURL(file);
      urls.current.add(url);
      return url;
    },
    release(url: string): void {
      URL.revokeObjectURL(url);
      urls.current.delete(url);
    },
  };
}

/**
 * Brand photos for a brief: each one is shrunk in the browser, uploaded at once and tracked here, so
 * the brief only ever submits photos that finished uploading (ADR-024).
 */
export function usePhotoUploads(options: { onUploaded?: () => void } = {}) {
  const [items, setItems] = useState<PhotoItem[]>([]);
  const counter = useRef(0);
  const previews = usePreviewUrls();

  const start = (role: ReferenceRole, file: File) => {
    counter.current += 1;
    const key = `photo-${String(counter.current)}`;
    const previewUrl = previews.create(file);
    const isUsable = isAccepted(file);
    const status: PhotoStatus = isUsable ? "uploading" : "failed";
    const item = {
      key,
      role,
      previewUrl,
      status,
      uploadId: null,
      error: isUsable ? null : UNREADABLE,
    };
    setItems((current) => [...current, item]);
    if (!isUsable) return;
    void uploadPhoto(file).then((result) => {
      setItems((current) => current.map((i) => (i.key === key ? { ...i, ...result } : i)));
      if (result.status === "ready") options.onUploaded?.();
    });
  };

  const remove = (key: string) => {
    const removed = items.find((item) => item.key === key);
    if (removed) previews.release(removed.previewUrl);
    setItems((current) => current.filter((item) => item.key !== key));
  };

  const references = useMemo<AdReferenceInput[]>(
    () =>
      items.flatMap((item) =>
        item.status === "ready" && item.uploadId
          ? [{ uploadId: item.uploadId, role: item.role }]
          : [],
      ),
    [items],
  );

  return {
    items,
    references,
    isUploading: items.some((item) => item.status === "uploading"),
    itemsFor: (role: ReferenceRole) => items.filter((item) => item.role === role),
    /** Starts uploading as many of `files` as there's room for; returns how many didn't fit. */
    add: (role: ReferenceRole, files: File[]): number => {
      const room = REFERENCE_LIMITS[role] - items.filter((item) => item.role === role).length;
      const accepted = files.slice(0, Math.max(0, room));
      for (const file of accepted) start(role, file);
      return files.length - accepted.length;
    },
    remove,
  };
}

export type PhotoUploads = ReturnType<typeof usePhotoUploads>;

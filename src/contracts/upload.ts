import { z } from "zod";

/**
 * Brand photo uploads (ADR-024). The browser shrinks photos to UPLOAD_MAX_EDGE before sending them,
 * which keeps uploads quick and every reference within the frame models' size limits; the server
 * still checks the bytes, because a client can send anything.
 */
export const UPLOAD_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const UploadContentType = z.enum(UPLOAD_CONTENT_TYPES);
export type UploadContentType = z.infer<typeof UploadContentType>;

export const UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const UPLOAD_MAX_EDGE = 2000;

export const UploadResponse = z.object({ uploadId: z.string(), url: z.string() });
export type UploadResponse = z.infer<typeof UploadResponse>;

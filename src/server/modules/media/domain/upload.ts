import { UPLOAD_MAX_BYTES, type UploadContentType } from "@/contracts/upload";
import { DomainError } from "@/server/platform/errors";

export class UploadRejectedError extends DomainError {
  readonly code = "UPLOAD_REJECTED";
}

const EXTENSION = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} satisfies Record<UploadContentType, string>;

const startsWith = (bytes: Uint8Array, signature: readonly number[], offset = 0) =>
  signature.every((byte, i) => bytes[offset + i] === byte);

/** The photo's real type from its first bytes: a client's declared type proves nothing. */
export function detectImageType(bytes: Uint8Array): UploadContentType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  // "RIFF", four size bytes, then "WEBP".
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8))
    return "image/webp";
  return null;
}

/** Checks a brand photo before it's stored: a JPEG, PNG or WebP within the size limit. */
export function inspectUpload(bytes: Uint8Array): {
  contentType: UploadContentType;
  extension: string;
} {
  if (bytes.byteLength === 0) throw new UploadRejectedError("The file is empty");
  if (bytes.byteLength > UPLOAD_MAX_BYTES) throw new UploadRejectedError("The photo is too large");
  const contentType = detectImageType(bytes);
  if (!contentType) throw new UploadRejectedError("Only JPEG, PNG and WebP photos can be used");
  return { contentType, extension: EXTENSION[contentType] };
}

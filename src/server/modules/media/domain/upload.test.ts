import { describe, expect, it } from "vitest";

import { UPLOAD_MAX_BYTES } from "@/contracts/upload";

import { detectImageType, inspectUpload, UploadRejectedError } from "./upload";

const bytes = (...values: number[]) => new Uint8Array(values);
const JPEG = bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0x10);
const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0);
const WEBP = bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50);

describe("detectImageType", () => {
  it("recognises JPEG, PNG and WebP by their first bytes", () => {
    expect(detectImageType(JPEG)).toBe("image/jpeg");
    expect(detectImageType(PNG)).toBe("image/png");
    expect(detectImageType(WEBP)).toBe("image/webp");
  });

  it("refuses anything else, whatever its name says", () => {
    expect(detectImageType(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
    expect(detectImageType(bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x41, 0x56, 0x49, 0x20))).toBe(
      null,
    );
  });
});

describe("inspectUpload", () => {
  it("returns the type and the extension to store it under", () => {
    expect(inspectUpload(PNG)).toEqual({ contentType: "image/png", extension: "png" });
  });

  it("rejects empty, oversized and non-image files", () => {
    expect(() => inspectUpload(new Uint8Array())).toThrow(UploadRejectedError);
    const huge = new Uint8Array(UPLOAD_MAX_BYTES + 1);
    huge.set(JPEG);
    expect(() => inspectUpload(huge)).toThrow(UploadRejectedError);
    expect(() => inspectUpload(bytes(1, 2, 3, 4))).toThrow(UploadRejectedError);
  });
});

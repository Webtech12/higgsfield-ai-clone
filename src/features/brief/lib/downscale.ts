import { UPLOAD_MAX_EDGE } from "@/contracts/upload";

/** The size that fits `maxEdge` on the long side, never enlarged. */
export function fitWithin(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/**
 * Shrinks a photo in the browser before it's uploaded: quick on a phone connection, within every
 * frame model's size limit, and re-encoded, which drops the camera's metadata (including location).
 * PNGs stay PNG so a product cut-out keeps its transparency.
 */
export async function downscale(file: File): Promise<{ blob: Blob; filename: string }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const size = fitWithin(bitmap.width, bitmap.height, UPLOAD_MAX_EDGE);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser can't prepare photos for upload");
  context.drawImage(bitmap, 0, 0, size.width, size.height);
  bitmap.close();

  const isPng = file.type === "image/png";
  const type = isPng ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error("This photo couldn't be prepared for upload"));
      },
      type,
      0.9,
    );
  });
  const base = file.name.replace(/\.[^.]+$/, "") || "photo";
  return { blob, filename: `${base}.${isPng ? "png" : "jpg"}` };
}

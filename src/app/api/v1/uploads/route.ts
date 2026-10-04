import { UPLOAD_MAX_BYTES, type UploadResponse } from "@/contracts/upload";
import { getModules } from "@/server/container";
import { ensureViewer } from "@/server/modules/identity";
import { UploadRejectedError } from "@/server/modules/media";
import { ValidationError } from "@/server/platform/errors";
import { handle } from "@/server/platform/http/handler";

import { clientIp } from "../_lib/clientIp";

export const runtime = "nodejs";

/**
 * A brand photo for a brief (ADR-024): multipart form data with one `file`. The file is checked
 * before a guest is created for it, and its bytes are checked again by the media module.
 */
export const POST = handle(async (request: Request) => {
  const { limits, media } = getModules();
  await limits.assertWithinRate(`upload-ip:${clientIp(request)}`, 60, 3600);

  const form = await request.formData().catch(() => {
    throw new ValidationError("Send the photo as multipart form data");
  });
  const file = form.get("file");
  if (!(file instanceof File)) throw new ValidationError("Attach the photo as `file`");
  if (file.size > UPLOAD_MAX_BYTES) throw new UploadRejectedError("The photo is too large");

  const viewer = await ensureViewer(request.headers);
  await limits.assertWithinRate(`upload:${viewer.id}`, 30, 3600);
  const upload = await media.saveUpload({
    userId: viewer.id,
    bytes: new Uint8Array(await file.arrayBuffer()),
  });
  return Response.json(upload satisfies UploadResponse, { status: 201 });
});

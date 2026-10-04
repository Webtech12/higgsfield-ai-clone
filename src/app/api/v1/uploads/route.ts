import { UPLOAD_MAX_BYTES, type UploadResponse } from "@/contracts/upload";
import { getModules } from "@/server/container";
import { UploadRejectedError } from "@/server/modules/media";
import { ValidationError } from "@/server/platform/errors";
import { handle } from "@/server/platform/http/handler";

import { networkOf } from "../_lib/network";

export const runtime = "nodejs";

/**
 * A brand photo for a brief (ADR-024): multipart form data with one `file`. The file is checked
 * before a guest is created for it, and its bytes are checked again by the media module. Uploads
 * have a daily allowance per network (ADR-027) and an hourly limit per user.
 */
export const POST = handle(async (request: Request) => {
  const { limits, media, guestAccess } = getModules();
  const network = networkOf(request);
  await limits.assertDailyAllowance("upload", network);

  const form = await request.formData().catch(() => {
    throw new ValidationError("Send the photo as multipart form data");
  });
  const file = form.get("file");
  if (!(file instanceof File)) throw new ValidationError("Attach the photo as `file`");
  if (file.size > UPLOAD_MAX_BYTES) throw new UploadRejectedError("The photo is too large");

  const viewer = await guestAccess.ensureViewer(request.headers, network);
  await limits.assertWithinRate(`upload:${viewer.id}`, 30, 3600);
  const upload = await media.saveUpload({
    userId: viewer.id,
    bytes: new Uint8Array(await file.arrayBuffer()),
  });
  return Response.json(upload satisfies UploadResponse, { status: 201 });
});

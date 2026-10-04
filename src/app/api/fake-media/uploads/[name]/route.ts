import { readFakeUpload } from "@/server/integrations/fake";
import { getEnv } from "@/server/platform/env";

export const runtime = "nodejs";

const CONTENT_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** Brand photos stored by the fake storage (PROVIDERS=fake only; real uploads live in Blob). */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/fake-media/uploads/[name]">,
): Promise<Response> {
  if (getEnv().PROVIDERS !== "fake") return new Response("Not found", { status: 404 });
  const { name } = await params;
  const bytes = await readFakeUpload(name);
  const contentType = CONTENT_TYPE[name.split(".").pop() ?? ""];
  if (!bytes || !contentType) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(bytes), {
    headers: { "Content-Type": contentType, "Cache-Control": "private, max-age=3600" },
  });
}

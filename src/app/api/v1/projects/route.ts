import { BriefInput } from "@/contracts/brief";
import type { CreateProjectResponse } from "@/contracts/project";
import { getModules } from "@/server/container";
import { ensureViewer } from "@/server/modules/identity";
import { accepted, handle, readJson } from "@/server/platform/http/handler";
import { inngest, projectCreated } from "@/server/platform/inngest";

export const runtime = "nodejs";

/** The client address behind Vercel's proxy, for per-IP limits on guest creation (ADR-016). */
const clientIp = (request: Request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

/**
 * Brief → new project → planning starts in the background. Creates a guest on first use. Planning is
 * free but rate-limited per IP (so bots can't mint guests) and per user, and stops at the kill-switch.
 */
export const POST = handle(async (request: Request) => {
  const brief = await readJson(request, BriefInput);
  const { limits, projects } = getModules();

  await limits.assertWithinRate(`brief-ip:${clientIp(request)}`, 30, 3600);
  const viewer = await ensureViewer(request.headers);
  await limits.assertWithinRate(`brief:${viewer.id}`, 12, 3600);
  await limits.assertCanGenerate(viewer.id);

  const { projectId } = await projects.createProject({ userId: viewer.id, brief });

  // After commit (ADR-018). If this send is lost, the project stays in `planning`.
  await inngest.send(projectCreated.create({ projectId }));
  return accepted({ projectId } satisfies CreateProjectResponse);
});

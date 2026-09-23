import { BriefInput } from "@/contracts/brief";
import type { CreateProjectResponse } from "@/contracts/project";
import { getModules } from "@/server/container";
import { ensureViewer } from "@/server/modules/identity";
import { accepted, handle, readJson } from "@/server/platform/http/handler";
import { inngest, projectCreated } from "@/server/platform/inngest";

export const runtime = "nodejs";

/** Brief → new project → planning starts in the background. Creates a guest on first use. */
export const POST = handle(async (request: Request) => {
  const brief = await readJson(request, BriefInput);
  const viewer = await ensureViewer(request.headers);
  const { projectId } = await getModules().projects.createProject({ userId: viewer.id, brief });

  // After commit (ADR-018). If this send is lost, the project stays in `planning` for the sweep.
  await inngest.send(projectCreated.create({ projectId }));
  return accepted({ projectId } satisfies CreateProjectResponse);
});

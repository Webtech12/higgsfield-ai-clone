import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { ProjectWorkspace } from "@/features/board";
import { getModules } from "@/server/container";
import { getCurrentUser } from "@/server/modules/identity";
import { getWorkspaceVersion, getWorkspaceView } from "@/server/queries";

export const metadata: Metadata = { title: "Your film" };

/** RSC: load the workspace server-side (no spinner on first paint), then poll on the client. */
export default async function ProjectPage({ params }: PageProps<"/p/[projectId]">) {
  const { projectId } = await params;
  const viewer = await getCurrentUser(await headers());
  const viewerId = viewer?.id ?? null;
  const { db } = getModules();

  const [view, version] = await Promise.all([
    getWorkspaceView(db, projectId, viewerId),
    getWorkspaceVersion(db, projectId, viewerId),
  ]);
  if (!view) notFound();

  return <ProjectWorkspace initial={{ view, etag: version ? `W/"${version}"` : null }} />;
}

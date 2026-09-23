import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { getModules } from "@/server/container";
import { getCurrentUser } from "@/server/modules/identity";
import { getWorkspaceVersion, getWorkspaceView } from "@/server/queries";
import { readSnapshot } from "@/server/platform/db";

import { Workspace } from "./_components/Workspace";

export const metadata: Metadata = { title: "Your film" };

/** RSC: load the workspace server-side (no spinner on first paint), then poll on the client. */
export default async function ProjectPage({ params }: PageProps<"/p/[projectId]">) {
  const { projectId } = await params;
  const viewer = await getCurrentUser(await headers());
  const viewerId = viewer?.id ?? null;
  const { db } = getModules();

  // One snapshot, so the ETag the client starts polling with matches the view it renders.
  const [view, version] = await readSnapshot(db, (snapshot) =>
    Promise.all([
      getWorkspaceView(snapshot, projectId, viewerId),
      getWorkspaceVersion(snapshot, projectId, viewerId),
    ]),
  );
  if (!view) notFound();

  return <Workspace initial={{ view, etag: version ? `W/"${version}"` : null }} />;
}

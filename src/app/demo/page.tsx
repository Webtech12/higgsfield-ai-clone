import { redirect } from "next/navigation";

import { getModules } from "@/server/container";
import { getDemoProjectId } from "@/server/queries";

// Looked up per request: the demo can change without a deploy (scripts/set-demo.mjs).
export const dynamic = "force-dynamic";

/** A stable link to the public demo film (AGENTS.md §1), wherever it currently lives. */
export default async function DemoPage() {
  const demoId = await getDemoProjectId(getModules().db);
  redirect(demoId ? `/p/${demoId}` : "/");
}

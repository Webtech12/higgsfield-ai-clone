import "server-only";

import { FakeLLMProvider, FakeMediaProvider } from "@/server/integrations/fake";
import { PassThroughStorage } from "@/server/integrations/fake/PassThroughStorage";
import { createDirectorModule } from "@/server/modules/director";
import { createMediaModule } from "@/server/modules/media";
import { createProductionModule } from "@/server/modules/production";
import { createProjectsModule } from "@/server/modules/projects";
import { createRoutingModule } from "@/server/modules/routing";
import { createStoryboardModule } from "@/server/modules/storyboard";
import { getDb } from "@/server/platform/db";
import { getEnv } from "@/server/platform/env";
import { newId } from "@/server/platform/ids";

/**
 * The composition root: the only place concrete classes are constructed (AGENTS.md §6). Built on first
 * use, so importing a route never needs configuration at build time. Real providers arrive in S4;
 * until then PROVIDERS=real fails loudly here rather than silently using fakes.
 */
function build() {
  const env = getEnv();
  if (env.PROVIDERS === "real") {
    throw new Error(
      "Real providers are wired up in S4 (docs/plan.md); use PROVIDERS=fake for now.",
    );
  }

  const db = getDb();
  const routing = createRoutingModule({ provider: "fake" });
  const media = createMediaModule({ storage: new PassThroughStorage() });
  const projects = createProjectsModule({ db, newId });
  const director = createDirectorModule({ llm: new FakeLLMProvider(), projects });
  const production = createProductionModule({
    db,
    provider: new FakeMediaProvider(),
    routing,
    media,
    projects,
    newId,
  });
  const storyboard = createStoryboardModule({
    projects,
    director: director.api,
    production: production.api,
  });

  return {
    db,
    projects,
    director: director.api,
    production: production.api,
    storyboard: storyboard.api,
    workflows: [...director.workflows, ...production.workflows, ...storyboard.workflows],
  };
}

let modules: ReturnType<typeof build> | undefined;

export function getModules(): ReturnType<typeof build> {
  modules ??= build();
  return modules;
}

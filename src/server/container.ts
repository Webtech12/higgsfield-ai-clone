import "server-only";

import { FakeLLMProvider, FakeMediaProvider } from "@/server/integrations/fake";
import { InMemoryRateLimiter } from "@/server/integrations/fake/InMemoryRateLimiter";
import { PassThroughStorage } from "@/server/integrations/fake/PassThroughStorage";
import { createCreditsModule } from "@/server/modules/credits";
import { createDirectorModule } from "@/server/modules/director";
import { createLimitsModule } from "@/server/modules/limits";
import { createMediaModule } from "@/server/modules/media";
import { createProductionModule } from "@/server/modules/production";
import { createProjectsModule } from "@/server/modules/projects";
import { createRoutingModule } from "@/server/modules/routing";
import { createStoryboardModule } from "@/server/modules/storyboard";
import { createUnitOfWork, getDb } from "@/server/platform/db";
import { getEnv, type Env } from "@/server/platform/env";
import { newId } from "@/server/platform/ids";
import { createOnboarding } from "@/server/processes/onboarding";

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
  const uow = createUnitOfWork(db);
  const routing = createRoutingModule({ provider: "fake" });
  const media = createMediaModule({ storage: new PassThroughStorage() });
  const credits = createCreditsModule({ db });
  const limits = createLimitsModule({
    db,
    rateLimiter: new InMemoryRateLimiter(),
    policy: capPolicy(env),
  });
  const projects = createProjectsModule({ db, newId });
  const director = createDirectorModule({ llm: new FakeLLMProvider(), projects });
  const production = createProductionModule({
    db,
    uow,
    provider: new FakeMediaProvider(),
    routing,
    media,
    projects,
    credits,
    limits,
    director: director.api,
    newId,
  });
  const storyboard = createStoryboardModule({
    projects,
    director: director.api,
    production: production.api,
  });
  const onboarding = createOnboarding({ credits });

  return {
    db,
    routing,
    projects,
    credits,
    limits,
    onboarding,
    director: director.api,
    production: production.api,
    storyboard: storyboard.api,
    workflows: [...director.workflows, ...production.workflows, ...storyboard.workflows],
  };
}

/** Video caps and the global daily kill-switch, from the environment (AGENTS.md §1). */
function capPolicy(env: Env) {
  return {
    guestVideoCap: env.GUEST_VIDEO_CAP,
    userVideoCap: env.USER_VIDEO_CAP,
    dailySpendCapCents: Math.round(env.DAILY_SPEND_CAP_USD * 100),
  };
}

let modules: ReturnType<typeof build> | undefined;

export function getModules(): ReturnType<typeof build> {
  modules ??= build();
  return modules;
}

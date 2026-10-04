import "server-only";

import {
  VercelBlobStorage,
  type BlobCredentials,
} from "@/server/integrations/blob/VercelBlobStorage";
import { FalMediaProvider } from "@/server/integrations/fal/FalMediaProvider";
import { FakeLLMProvider, FakeMediaProvider } from "@/server/integrations/fake";
import { InMemoryRateLimiter } from "@/server/integrations/fake/InMemoryRateLimiter";
import { PassThroughStorage } from "@/server/integrations/fake/PassThroughStorage";
import { OpenAILLMProvider } from "@/server/integrations/openai/OpenAILLMProvider";
import { UpstashRateLimiter } from "@/server/integrations/upstash/UpstashRateLimiter";
import { createCreditsModule, type CreditsApi } from "@/server/modules/credits";
import { createDirectorModule, type LLMProvider } from "@/server/modules/director";
import { createGuest, getCurrentUser } from "@/server/modules/identity";
import { createLimitsModule, type LimitsApi, type RateLimiter } from "@/server/modules/limits";
import { createMediaModule, type MediaApi, type ObjectStorage } from "@/server/modules/media";
import { createProductionModule, type MediaProvider } from "@/server/modules/production";
import { createProjectsModule, type ProjectsApi } from "@/server/modules/projects";
import { createRoutingModule, type ProviderName } from "@/server/modules/routing";
import { createStoryboardModule } from "@/server/modules/storyboard";
import { createTalentModule, type TalentApi } from "@/server/modules/talent";
import { LLM_POLICY, STORAGE_POLICY } from "@/server/platform/config/resilience";
import { createUnitOfWork, getDb } from "@/server/platform/db";
import { getEnv, type Env } from "@/server/platform/env";
import { newId } from "@/server/platform/ids";
import { createCreateAd } from "@/server/processes/createAd";
import { createGuestAccess } from "@/server/processes/guestAccess";
import { createOnboarding } from "@/server/processes/onboarding";

/**
 * The composition root: the only place concrete classes are constructed (AGENTS.md §6). Built on first
 * use, so importing a route never needs configuration at build time.
 */
function build() {
  const env = getEnv();
  const adapter = adapters(env);
  const db = getDb();
  const uow = createUnitOfWork(db);
  const routing = createRoutingModule({ provider: adapter.provider });
  const media = createMediaModule({ db, storage: adapter.storage, newId });
  const credits = createCreditsModule({ db });
  const limits = createLimitsModule({
    db,
    rateLimiter: adapter.rateLimiter,
    policy: capPolicy(env),
  });
  const projects = createProjectsModule({ db, newId });
  const talent = createTalentModule({ db });
  const director = createDirectorModule({ llm: adapter.llm, projects, talent });
  const production = createProductionModule({
    db,
    uow,
    provider: adapter.media,
    routing,
    media,
    projects,
    credits,
    limits,
    director: director.api,
    talent,
    newId,
  });
  const storyboard = createStoryboardModule({
    projects,
    director: director.api,
    production: production.api,
    talent,
  });

  return {
    db,
    routing,
    projects,
    credits,
    limits,
    media,
    ...processes({ credits, limits, media, talent, projects }),
    director: director.api,
    production: production.api,
    storyboard: storyboard.api,
    workflows: [...director.workflows, ...production.workflows, ...storyboard.workflows],
  };
}

/** Processes coordinate modules through their public APIs (AGENTS.md §3). */
function processes(m: {
  credits: CreditsApi;
  limits: LimitsApi;
  media: MediaApi;
  talent: TalentApi;
  projects: ProjectsApi;
}) {
  return {
    onboarding: createOnboarding({ credits: m.credits }),
    guestAccess: createGuestAccess({ currentUser: getCurrentUser, createGuest, limits: m.limits }),
    createAd: createCreateAd(m),
  };
}

interface Adapters {
  provider: ProviderName;
  llm: LLMProvider;
  media: MediaProvider;
  storage: ObjectStorage;
  rateLimiter: RateLimiter;
}

/** The adapter behind each port: in-process fakes, or the real providers (AGENTS.md §11). */
function adapters(env: Env): Adapters {
  if (env.PROVIDERS === "fake") {
    return {
      provider: "fake",
      llm: new FakeLLMProvider(),
      media: new FakeMediaProvider(),
      storage: new PassThroughStorage(),
      rateLimiter: new InMemoryRateLimiter(),
    };
  }
  return {
    provider: "fal",
    llm: new OpenAILLMProvider({
      apiKey: env.OPENAI_API_KEY,
      model: env.DIRECTOR_MODEL,
      ...LLM_POLICY,
    }),
    media: new FalMediaProvider(env.FAL_KEY),
    storage: new VercelBlobStorage({
      credentials: blobCredentials(env.BLOB_READ_WRITE_TOKEN, env.BLOB_STORE_ID),
      ...STORAGE_POLICY,
    }),
    rateLimiter: new UpstashRateLimiter({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    }),
  };
}

/** A read-write token if there is one, else the store id for Vercel's OIDC auth (ADR-023). */
function blobCredentials(token: string | undefined, storeId: string | undefined): BlobCredentials {
  if (token) return { token };
  if (storeId) return { storeId };
  // env.ts already refuses real mode without either; this keeps the types honest.
  throw new Error("Vercel Blob needs BLOB_READ_WRITE_TOKEN or BLOB_STORE_ID");
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

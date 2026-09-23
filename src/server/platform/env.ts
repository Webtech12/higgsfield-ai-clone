import "server-only";

import { z } from "zod";

/**
 * The one place that reads process.env (AGENTS.md §11). Parsing is lazy and memoised: a page that
 * never touches the database or a provider can build and render without any secrets, and a missing
 * variable fails loudly the first time it is actually needed.
 */

const common = {
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url(),
  DATABASE_URL_UNPOOLED: z.url().optional(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url().optional(),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  MAGIC_LINK_ENABLED: z.stringbool().default(false),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).optional(),
  GUEST_VIDEO_CAP: z.coerce.number().int().positive().default(6),
  USER_VIDEO_CAP: z.coerce.number().int().positive().default(18),
  DAILY_SPEND_CAP_USD: z.coerce.number().positive().default(10),
};

/** PROVIDERS=fake: in-process fakes for the LLM, media, storage, rate limiting and email. */
const FakeEnv = z.object({ ...common, PROVIDERS: z.literal("fake") });

/** PROVIDERS=real: every provider key is required, so a misconfigured deploy fails at first use. */
const RealEnv = z.object({
  ...common,
  PROVIDERS: z.literal("real"),
  OPENAI_API_KEY: z.string().min(1),
  DIRECTOR_MODEL: z.string().min(1).default("gpt-6-sol"),
  FAL_KEY: z.string().min(1),
  INNGEST_EVENT_KEY: z.string().min(1),
  INNGEST_SIGNING_KEY: z.string().min(1),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET: z.string().min(1),
  R2_PUBLIC_BASE_URL: z.url(),
  UPSTASH_REDIS_REST_URL: z.url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
});

const EnvSchema = z.discriminatedUnion("PROVIDERS", [FakeEnv, RealEnv]);
export type Env = z.infer<typeof EnvSchema>;

/** Treats `KEY=` lines in .env files as unset, and defaults PROVIDERS to fake. */
export function parseEnv(source: Record<string, string | undefined>): Env {
  const present = Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== undefined && value !== ""),
  );
  const result = EnvSchema.safeParse({ PROVIDERS: "fake", ...present });
  if (!result.success) {
    // Names and reasons only: never echo values, which may be secrets.
    throw new Error(`Invalid environment:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

let cached: Env | undefined;

export function getEnv(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}

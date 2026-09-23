import { describe, expect, it } from "vitest";

import { parseEnv } from "./env";

const minimal = {
  DATABASE_URL: "postgres://user:pass@localhost:5432/director",
  BETTER_AUTH_SECRET: "x".repeat(32),
};

describe("parseEnv", () => {
  it("defaults to fake providers and needs only the database and auth secret", () => {
    const env = parseEnv(minimal);

    expect(env.PROVIDERS).toBe("fake");
    expect(env.GUEST_VIDEO_CAP).toBe(6);
    expect(env.USER_VIDEO_CAP).toBe(18);
    expect(env.DAILY_SPEND_CAP_USD).toBe(10);
    expect(env.MAGIC_LINK_ENABLED).toBe(false);
  });

  it("treats empty values from .env files as unset", () => {
    const env = parseEnv({ ...minimal, GOOGLE_CLIENT_ID: "", GUEST_VIDEO_CAP: "" });

    expect(env.GOOGLE_CLIENT_ID).toBeUndefined();
    expect(env.GUEST_VIDEO_CAP).toBe(6);
  });

  it("requires every provider key in real mode", () => {
    expect(() => parseEnv({ ...minimal, PROVIDERS: "real" })).toThrow(/OPENAI_API_KEY/);
  });

  it("names the invalid variable without echoing its value", () => {
    const secret = "short-secret-value";

    const failure = () => parseEnv({ ...minimal, BETTER_AUTH_SECRET: secret });

    expect(failure).toThrow(/BETTER_AUTH_SECRET/);
    expect(failure).not.toThrow(new RegExp(secret));
  });
});

import { describe, it } from "vitest";

import { FalMediaProvider } from "@/server/integrations/fal/FalMediaProvider";
import { OpenAILLMProvider } from "@/server/integrations/openai/OpenAILLMProvider";
import { createRoutingModule } from "@/server/modules/routing";
import { LLM_POLICY } from "@/server/platform/config/resilience";

import { describeLLMProviderContract } from "./llmProvider.suite";
import { describeMediaProviderContract } from "./mediaProvider.suite";

/**
 * The real providers on the same suites. Opt-in, because it spends money (one frame, one 4 s video
 * and one plan: about $0.15): RUN_REAL_CONTRACTS=1 npx vitest run tests/contracts/real
 * Keys come from .env.local; they are never printed.
 */
const isEnabled = process.env.RUN_REAL_CONTRACTS === "1";
if (isEnabled) {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // CI or a shell that already exports the keys.
  }
}

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for the real contract run`);
  return value;
};

describe.skipIf(!isEnabled)("real providers", () => {
  // A skipped suite still runs this callback to collect its tests, so build nothing without opt-in.
  if (!isEnabled) {
    it("runs only with RUN_REAL_CONTRACTS=1", () => undefined);
    return;
  }
  const routing = createRoutingModule({ provider: "fal" });

  describeMediaProviderContract("fal", () => ({
    provider: new FalMediaProvider(required("FAL_KEY")),
    frameModel: routing.selectModel({ kind: "frame" }).id,
    videoModel: routing.selectModel({ kind: "video" }).id,
    wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    pollMs: 3_000,
    maxPolls: 100,
    timeoutMs: 330_000,
  }));

  describeLLMProviderContract(
    "openai",
    () =>
      new OpenAILLMProvider({
        apiKey: required("OPENAI_API_KEY"),
        model: process.env.DIRECTOR_MODEL ?? "gpt-6-sol",
        ...LLM_POLICY,
      }),
    LLM_POLICY.timeoutMs + 10_000,
  );
});

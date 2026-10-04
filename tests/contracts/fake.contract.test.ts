import { FakeLLMProvider, FakeMediaProvider } from "@/server/integrations/fake";
import { createRoutingModule } from "@/server/modules/routing";

import { describeLLMProviderContract } from "./llmProvider.suite";
import { describeMediaProviderContract } from "./mediaProvider.suite";

// The fakes run the same suites as the real providers, on a fake clock: no keys, no spend, no waiting.
const routing = createRoutingModule({ provider: "fake" });

describeMediaProviderContract("fake", () => {
  let now = 1_000_000;
  return {
    provider: new FakeMediaProvider(() => now),
    frameModel: routing.selectModel({ kind: "frame" }).id,
    videoModel: routing.selectModel({ kind: "video" }).id,
    wait: (ms) => {
      now += ms;
      return Promise.resolve();
    },
    pollMs: 1_000,
    maxPolls: 60,
    timeoutMs: 5_000,
  };
});

describeLLMProviderContract("fake", () => new FakeLLMProvider(), 5_000);

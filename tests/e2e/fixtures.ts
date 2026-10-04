import { randomInt } from "node:crypto";

import { test as base } from "@playwright/test";

export { expect } from "@playwright/test";

/** A 1×1 PNG: enough for the browser to resize and for the server to recognise as a photo. */
export const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

/** An address in its own /64 of the IPv6 documentation range: a network no test has used. */
export const freshNetwork = (): string =>
  `2001:db8:${randomInt(0x10000).toString(16)}:${randomInt(0x10000).toString(16)}::1`;

/**
 * Each test browses from its own network, so the per-network free trial and daily allowances
 * (ADR-027) never carry over between tests, or between runs against a server that is kept running.
 */
export const test = base.extend({
  // Playwright's fixture callback, named so React's hook rules don't mistake it for `use`.
  page: async ({ page }, provide) => {
    await page.setExtraHTTPHeaders({ "x-forwarded-for": freshNetwork() });
    await provide(page);
  },
});

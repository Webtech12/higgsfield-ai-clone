import { expect, freshNetwork, test, TINY_PNG } from "./fixtures";

// One free trial per network a day (ADR-027): a second visitor on the same network is told so
// before anything is made for them, and Better Auth's own guest route can't be used to skip it.

test("a network's second visitor is told today's free trial is used", async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(90_000);
  // Two browsers on one network: same address, separate cookies.
  const sameNetwork = {
    ...(baseURL ? { baseURL } : {}),
    extraHTTPHeaders: { "x-forwarded-for": freshNetwork() },
  };

  const first = await browser.newContext(sameNetwork);
  const started = await first.request.post("/api/v1/session");
  expect(started.ok()).toBe(true);
  expect(await started.json()).toEqual({ isGuest: true });

  const second = await browser.newContext(sameNetwork);
  const page = await second.newPage();
  await page.goto("/");
  await page
    .getByLabel("Add photo")
    .first()
    .setInputFiles({ name: "luma.png", mimeType: "image/png", buffer: TINY_PNG });
  await expect(page.getByText(/Today's free trial on this network has been used/)).toBeVisible({
    timeout: 30_000,
  });

  // The first visitor carries on: their session isn't a new trial.
  expect((await first.request.post("/api/v1/session")).ok()).toBe(true);

  await first.close();
  await second.close();
});

test("guests can't be made through Better Auth's own route", async ({ request }) => {
  const response = await request.post("/api/auth/sign-in/anonymous", {
    data: {},
    headers: { "x-forwarded-for": freshNetwork() },
  });
  expect(response.status()).toBe(404);
});

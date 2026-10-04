import { expect, test } from "@playwright/test";

// The core loop on fakes: brief → three storyboarded directions → choose one → edit a shot → redraw
// its frame → produce (30 of the guest's 40 credits) → watch the film. Generation is asynchronous,
// so waits are generous.
test("brief to film: storyboard, edit, produce and play", async ({ page }) => {
  test.setTimeout(300_000);

  await page.goto("/");
  await page
    .getByLabel("What's your film about?")
    .fill("A lighthouse keeper finds a message in a bottle from her future self");
  await page.getByRole("button", { name: "Direct it" }).click();

  await expect(page).toHaveURL(/\/p\/prj_/, { timeout: 60_000 });
  await expect(page.getByText(/Storyboards ready/)).toBeVisible({ timeout: 120_000 });
  await expect(page.getByRole("img")).toHaveCount(9);
  await expect(page.getByRole("button", { name: "Choose this direction" })).toHaveCount(3);

  await page.getByRole("button", { name: "Choose this direction" }).nth(1).click();
  await expect(page.getByText("Your direction")).toBeVisible();
  await expect(page.getByRole("button", { name: "Choose this direction" })).toHaveCount(0);

  await page.getByRole("button", { name: "Edit shot 1" }).click();
  await page
    .getByLabel("What the camera sees")
    .fill("Rain streaks across the lamp glass as she reads");
  await page.getByRole("button", { name: "Save shot" }).click();
  await expect(page.getByText("Frame out of date")).toBeVisible();

  await page.getByRole("button", { name: "Redraw frame" }).click();
  await expect(page.getByText("Frame out of date")).toBeHidden({ timeout: 60_000 });
  await expect(page.getByText("Rain streaks across the lamp glass as she reads")).toBeVisible();

  // Produce: the price is on the button, and the header balance drops when it's reserved.
  await expect(page.getByText("40 credits", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Produce 3 shots · 30 credits" }).click();
  await expect(page.getByText(/Rendering your film/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("10 credits", { exact: true })).toBeVisible();

  await expect(page.getByText("Your film is ready. Press play to watch it.")).toBeVisible({
    timeout: 120_000,
  });
  await expect(page.getByRole("link", { name: /^Download shot/ })).toHaveCount(3);

  // Downloads stream through our route under a friendly name, not the storage key.
  const href = await page.getByRole("link", { name: "Download shot 1" }).getAttribute("href");
  const download = await page.request.get(href ?? "");
  expect(download.ok()).toBe(true);
  expect(download.headers()["content-disposition"]).toMatch(
    /attachment; filename=".+-shot-1\.webm"/,
  );

  // Playback runs the shots back to back.
  await page.getByRole("button", { name: "Play film" }).click();
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  await expect
    .poll(() =>
      page.locator("video[data-current]").evaluate((v: HTMLVideoElement) => v.currentTime),
    )
    .toBeGreaterThan(0.2);
  await expect(page.getByText("Shot 2 of 3")).toBeVisible({ timeout: 20_000 });
});

test("a brief that is too short is explained, not sent", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("What's your film about?").fill("A film");
  await page.getByRole("button", { name: "Direct it" }).click();

  await expect(page.getByText(/at least 12 characters/)).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});
